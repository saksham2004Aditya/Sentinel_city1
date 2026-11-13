require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Gemini setup ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Shared model for both ward AI alerts and the chatbot
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
const chatModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  tools: [{ googleSearch: {} }],
});

const predictionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── DB helpers ────────────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error('DB read error:', e.message);
    return { wards: [], signals: {}, diseaseData: {}, hospitalReports: [], trendHistory: {}, environmentalLayer: {}, simulationHistory: [], users: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Heuristic alert engine ────────────────────────────────────────────────────
function generateAlert(signals = {}, diseaseData = {}) {
  const clinicVisits = signals.clinicVisits || 0;
  const pharmacySales = signals.pharmacySales || 0;
  const pollution = signals.pollution || 0;
  const temperature = signals.temperature || 0;
  const mobility = signals.mobility || 0;

  const healthScore = clinicVisits * 0.4 + pharmacySales * 0.3 + pollution * 0.2 + mobility * 0.1;

  let level = 'normal';
  let disease = null;
  let reason = 'Signals within expected ranges. No unusual pattern detected.';

  // Identify top disease by combined visits + sales
  if (diseaseData && Object.keys(diseaseData).length > 0) {
    const diseases = Object.entries(diseaseData)
      .map(([name, d]) => ({ name, total: (d.clinicVisits || 0) + (d.pharmacySales || 0) }))
      .sort((a, b) => b.total - a.total);

    if (diseases.length > 0) {
      disease = diseases[0].name;
      const intensity = diseases[0].total;
      if (intensity > 400) {
        level = 'high';
        reason = `Clinic visits + pharmacy counts for ${disease} exceed 400 (observed: ${intensity}). High-volume aggregated reports suggest further field verification is warranted.`;
      } else if (intensity > 200) {
        level = 'medium';
        reason = `Aggregated reports for ${disease} are above the moderate threshold (200). Observed: ${intensity}. Monitor trends over the next reporting period.`;
      } else {
        level = 'normal';
        reason = `Reported ${disease} counts are within manageable range (observed: ${intensity}). Continue routine monitoring.`;
      }
    }
  }

  // Environmental boosters
  if (level === 'normal' && healthScore > 400) {
    level = 'medium';
    reason = `Environmental health score (${Math.round(healthScore)}) exceeds normal range without a confirmed disease report. Possible early signal — requires facility verification.`;
  }

  return {
    level,
    disease,
    reason,
    alertScore: Math.min(100, Math.round(healthScore / 10)),
    thresholds: { high: 400, medium: 200 },
    comparisonNote: 'Alert thresholds are heuristic. They are not medically validated and require human review before any public-health action.',
  };
}

// ── City-wide analytics ───────────────────────────────────────────────────────
function computeCityAnalytics() {
  const db = readDb();
  const wards = db.wards || [];
  const baseline = { respiratoryBaseline: 547 }; // synthetic city average

  const wardAnalytics = wards.map((ward) => {
    const signalEntry = (db.signals || {})[ward.id] || {};
    const signals = signalEntry.signals || {};
    const diseaseData = (db.diseaseData || {})[ward.id] || {};
    const envData = (db.environmentalLayer || {})[ward.id] || {};

    const respiratory = (signals.clinicVisits || 0) + (signals.pharmacySales || 0);
    const delta = baseline.respiratoryBaseline > 0
      ? ((respiratory - baseline.respiratoryBaseline) / baseline.respiratoryBaseline) * 100
      : 0;
    const situationOfConcern = delta > 5;

    const topDisease = Object.entries(diseaseData)
      .map(([name, d]) => ({ name, total: (d.clinicVisits || 0) + (d.pharmacySales || 0) }))
      .sort((a, b) => b.total - a.total)[0] || null;

    return {
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone || '',
      respiratoryComplaints: respiratory,
      baselineDeltaPct: Math.round(delta * 10) / 10,
      situationOfConcern,
      spreadRiskScore: Math.min(30, Math.round(respiratory / 100) + Math.round((signals.mobility || 0) / 20)),
      vulnerabilityIndex: Math.min(30, Math.round(respiratory / 100) + (situationOfConcern ? 2 : 0) + Math.round((envData.floodRisk === 'high' ? 3 : envData.floodRisk === 'medium' ? 1 : 0))),
      topDisease: topDisease ? topDisease.name : null,
      environmentalRisk: envData.floodRisk || 'unknown',
      explanation: situationOfConcern
        ? `Aggregated clinic + pharmacy counts (${respiratory}) are ${Math.abs(Math.round(delta))}% above the city baseline (${baseline.respiratoryBaseline}). This crosses the 5% flag threshold. ${topDisease ? `Largest contributor: ${topDisease.name} (${topDisease.total} reports).` : ''} Human verification is recommended.`
        : `Counts (${respiratory}) are within ±5% of city baseline (${baseline.respiratoryBaseline}). No unusual pattern detected in this reporting period.`,
    };
  });

  const totalCases = wardAnalytics.reduce((s, w) => s + w.respiratoryComplaints, 0);
  const flaggedWards = wardAnalytics.filter((w) => w.situationOfConcern).length;

  return {
    baseline,
    totalAggregatedCases: totalCases,
    totalWards: wards.length,
    flaggedWards,
    methodology: 'Anomaly flag: current aggregated clinic visits + pharmacy sales exceeds city-wide synthetic baseline by > 5%. Heuristic only. Not medically validated.',
    dataNote: 'SYNTHETIC DEMONSTRATION DATA — not real patient counts.',
    wards: wardAnalytics,
  };
}

function getDiseaseCategory(total) {
  if (total === 0) return 'ND';
  if (total >= 400) return 'red';
  if (total >= 200) return 'yellow';
  return 'green';
}

function computeDiseaseSummary() {
  const db = readDb();
  const wards = db.wards || [];
  const state = 'Tamil Nadu';
  const city = 'Chennai Metro';
  const wardSummaries = wards.map((ward) => {
    const diseases = Object.entries((db.diseaseData || {})[ward.id] || {})
      .map(([name, data]) => ({
        name,
        count: Number(data.clinicVisits || 0) + Number(data.pharmacySales || 0),
      }))
      .sort((a, b) => b.count - a.count);
    const total = diseases.reduce((sum, disease) => sum + disease.count, 0);
    return {
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone || 'Unknown',
      state,
      city,
      total,
      category: getDiseaseCategory(total),
      diseases: diseases.map((disease) => ({
        ...disease,
        category: getDiseaseCategory(disease.count),
      })),
    };
  });

  const diseaseTotals = wardSummaries.reduce((totals, ward) => {
    ward.diseases.forEach(({ name, count }) => {
      totals[name] = (totals[name] || 0) + count;
    });
    return totals;
  }, {});
  const total = wardSummaries.reduce((sum, ward) => sum + ward.total, 0);

  return {
    state,
    city,
    period: '2026-W39',
    total,
    category: getDiseaseCategory(total),
    diseaseTotals: Object.entries(diseaseTotals)
      .map(([name, count]) => ({ name, count, category: getDiseaseCategory(count) }))
      .sort((a, b) => b.count - a.count),
    wards: wardSummaries,
    legend: {
      red: '400+ aggregated reports',
      yellow: '200–399 aggregated reports',
      green: '1–199 aggregated reports',
      ND: 'No disease data reported',
    },
    dataNote: 'Counts combine clinic visits and pharmacy sales from synthetic facility reports. They are not confirmed cases or diagnoses.',
  };
}

// ── Local AI fallback ─────────────────────────────────────────────────────────
function generateLocalPrediction(wardName, signals = {}, diseaseData = {}) {
  const clinicVisits = signals.clinicVisits || 0;
  const pharmacySales = signals.pharmacySales || 0;
  const pollution = signals.pollution || 0;
  const temperature = signals.temperature || 0;

  let prediction, risk, prevention;

  const diseases = Object.entries(diseaseData || {})
    .map(([name, d]) => ({ name, total: (d.clinicVisits || 0) + (d.pharmacySales || 0) }))
    .sort((a, b) => b.total - a.total);

  const topDisease = diseases[0];

  if (topDisease && topDisease.total > 400) {
    risk = 'High';
    prediction = `${wardName} shows a high volume of aggregated reports for ${topDisease.name} (${topDisease.total} facility-reported cases/sales this period). Further field investigation is recommended by local public-health authorities.`;
  } else if (topDisease && topDisease.total > 200) {
    risk = 'Medium';
    prediction = `${wardName} has an elevated ${topDisease.name} count (${topDisease.total} reports). Monitor trends over the next reporting period. Human verification advised before escalation.`;
  } else if (clinicVisits > 300 || pharmacySales > 250) {
    risk = 'Medium';
    prediction = `${wardName} shows elevated clinic visits (${clinicVisits}) and pharmacy counts (${pharmacySales}) without a confirmed predominant disease. Environmental factors (AQI ${pollution}) may contribute. Verification recommended.`;
  } else {
    risk = 'Low';
    prediction = `${wardName} currently shows signals within expected ranges. Continue routine monitoring and reporting protocols.`;
  }

  if (topDisease) {
    const d = topDisease.name.toLowerCase();
    if (d.includes('dengue') || d.includes('malaria') || d.includes('chikungunya')) {
      prevention = [
        'Eliminate standing water to reduce mosquito breeding sites',
        'Use mosquito repellents and wear protective clothing at dawn/dusk',
        'Sleep under mosquito nets; use indoor residual spraying where advised',
        'Report fever with joint pain or rash to the nearest health facility promptly',
        'Support community-led vector surveillance and fogging operations',
      ];
    } else if (d.includes('covid') || d.includes('flu') || d.includes('respiratory')) {
      prevention = [
        'Wear masks in crowded or poorly ventilated spaces',
        'Practise frequent hand-washing with soap for at least 20 seconds',
        'Stay home if symptomatic; seek testing at designated health facilities',
        'Improve natural ventilation in homes, classrooms and workplaces',
        'Follow vaccination guidance from local health authorities',
      ];
    } else if (d.includes('gastro') || d.includes('typhoid') || d.includes('diarrhea')) {
      prevention = [
        'Drink only boiled or treated water from verified safe sources',
        'Wash hands before meals and after toilet use',
        'Avoid raw street food during an active alert period',
        'Seek early medical care for persistent diarrhoea or dehydration',
        'Report any suspected water-contamination incidents to authorities',
      ];
    } else {
      prevention = [
        'Maintain strict personal hygiene and hand-washing practices',
        'Avoid close contact with individuals showing active symptoms',
        'Seek medical consultation early if symptoms develop',
        'Follow current advisories from local public-health department',
        'Ensure timely vaccination per the national schedule',
      ];
    }
  } else {
    prevention = [
      'Continue routine hygiene and preventive health measures',
      'Monitor for any emerging symptom clusters in the community',
      'Report unusual case surges to the nearest primary health centre',
      'Stay informed via official public-health channels',
    ];
  }

  return { prediction, prevention, risk, disclaimer: 'This analysis is generated from aggregated facility-reported counts and heuristic rules. It is not a medically validated outbreak diagnosis. Human public-health officer review is required before any action.' };
}

// ── Gemini AI prediction ──────────────────────────────────────────────────────
async function getAIPrediction(wardName, signals, diseaseData) {
  const cacheKey = `${wardName}:${JSON.stringify(signals)}:${JSON.stringify(diseaseData)}`;
  const cached = predictionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const hasSignals = signals && (signals.clinicVisits > 0 || signals.pharmacySales > 0);
  const hasDiseaseData = diseaseData && Object.keys(diseaseData).length > 0;

  if (!hasSignals && !hasDiseaseData) {
    const fallback = generateLocalPrediction(wardName, signals, diseaseData);
    predictionCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }

  const prompt = `You are an explainable public-health decision-support engine for "Sentinel City". 
Data source: aggregated facility-reported disease counts (NOT individual patient records).
Ward: ${wardName}
Aggregated signals this period: ${JSON.stringify(signals)}
Aggregated disease counts by disease: ${JSON.stringify(diseaseData)}

Your task:
1. Write a concise "prediction" (2–3 sentences) describing what the aggregated data patterns suggest and what human verification step would be most relevant. Do NOT claim to detect individual infections or predict outbreak probability.
2. List 3–5 actionable "prevention" steps appropriate for the suggested disease pattern.
3. Assign a "risk" level: "High", "Medium", or "Low" based on the data volume only.
4. Add a brief "disclaimer" reminding readers this is a decision-support tool requiring human review.

IMPORTANT: Output valid JSON only. No markdown, no preamble.
Format: { "prediction": "...", "prevention": ["..."], "risk": "High|Medium|Low", "disclaimer": "..." }`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    if (!parsed.prediction || !Array.isArray(parsed.prevention) || !parsed.risk) {
      throw new Error('Invalid AI response structure');
    }
    predictionCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
    return parsed;
  } catch (err) {
    console.warn('Gemini error, using local fallback:', err.message);
    const fallback = generateLocalPrediction(wardName, signals, diseaseData);
    predictionCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Sentinel City backend running', version: '2.0', dataNote: 'SYNTHETIC DEMONSTRATION DATA' });
});

// ── Wards ─────────────────────────────────────────────────────────────────────
app.get('/wards', (req, res) => {
  const db = readDb();
  res.json(db.wards || []);
});

app.post('/wards', (req, res) => {
  const { name, lat, lng, zone, population, facilities } = req.body;
  if (!name || name.trim() === '') return res.status(400).json({ error: 'Ward name is required' });
  const latN = Number(lat), lngN = Number(lng);
  if (isNaN(latN) || isNaN(lngN)) return res.status(400).json({ error: 'Valid lat and lng are required' });

  const db = readDb();
  const ward = { id: generateId(), name: name.trim(), lat: latN, lng: lngN, zone: zone || '', population: Number(population) || 0, facilities: Number(facilities) || 0 };
  db.wards.push(ward);
  writeDb(db);
  res.status(201).json(ward);
});

// ── Signals ───────────────────────────────────────────────────────────────────
app.post('/signals/:wardId', (req, res) => {
  const { wardId } = req.params;
  const { clinicVisits, pharmacySales, pollution, temperature, mobility } = req.body;

  const db = readDb();
  if (!db.wards.find((w) => w.id === wardId)) return res.status(404).json({ error: 'Ward not found' });

  const signals = {
    clinicVisits: Math.max(0, Number(clinicVisits) || 0),
    pharmacySales: Math.max(0, Number(pharmacySales) || 0),
    pollution: Math.max(0, Number(pollution) || 0),
    temperature: Number(temperature) || 0,
    mobility: Math.max(0, Number(mobility) || 0),
  };

  if (!db.signals) db.signals = {};
  db.signals[wardId] = { signals, reportedAt: new Date().toISOString() };
  const diseaseData = (db.diseaseData || {})[wardId] || {};
  db.signals[wardId].alert = generateAlert(signals, diseaseData);
  writeDb(db);
  res.json({ wardId, signals, alert: db.signals[wardId].alert });
});

app.get('/signals/:wardId', (req, res) => {
  const { wardId } = req.params;
  const db = readDb();
  const wardExists = db.wards.find((w) => w.id === wardId);
  if (!wardExists) return res.status(404).json({ error: 'Ward not found' });

  const diseaseData = (db.diseaseData || {})[wardId] || {};

  if (!db.signals || !db.signals[wardId]) {
    const emptySignals = { clinicVisits: 0, pharmacySales: 0, pollution: 0, temperature: 0, mobility: 0 };
    return res.json({ wardId, signals: emptySignals, alert: generateAlert(emptySignals, diseaseData), diseaseData });
  }

  const alert = generateAlert(db.signals[wardId].signals, diseaseData);
  res.json({ wardId, signals: db.signals[wardId].signals, alert, diseaseData });
});

// ── Disease data ──────────────────────────────────────────────────────────────
app.post('/disease-data/:wardId', (req, res) => {
  const { wardId } = req.params;
  const { disease, clinicVisits, pharmacySales, reportingPeriod, notes, reportedBy } = req.body;
  if (!disease || disease.trim() === '') return res.status(400).json({ error: 'Disease name is required' });

  const db = readDb();
  if (!db.wards.find((w) => w.id === wardId)) return res.status(404).json({ error: 'Ward not found' });

  if (!db.diseaseData) db.diseaseData = {};
  if (!db.diseaseData[wardId]) db.diseaseData[wardId] = {};

  const diseaseName = disease.trim().toLowerCase();
  db.diseaseData[wardId][diseaseName] = {
    clinicVisits: Math.max(0, Number(clinicVisits) || 0),
    pharmacySales: Math.max(0, Number(pharmacySales) || 0),
    reportingPeriod: reportingPeriod || '',
    reportedBy: reportedBy || '',
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  };

  const signals = ((db.signals || {})[wardId] || {}).signals || { clinicVisits: 0, pharmacySales: 0, pollution: 0, temperature: 0, mobility: 0 };
  const alert = generateAlert(signals, db.diseaseData[wardId]);

  if (!db.signals) db.signals = {};
  if (!db.signals[wardId]) db.signals[wardId] = { signals };
  db.signals[wardId].alert = alert;

  writeDb(db);
  res.json({ wardId, disease: diseaseName, data: db.diseaseData[wardId][diseaseName], alert });
});

app.get('/disease-data/:wardId', (req, res) => {
  const { wardId } = req.params;
  const db = readDb();
  res.json({ wardId, diseases: (db.diseaseData || {})[wardId] || {} });
});

// ── Hospital Reports ──────────────────────────────────────────────────────────
app.get('/hospital-reports', (req, res) => {
  const db = readDb();
  const { wardId, disease, status } = req.query;
  let reports = db.hospitalReports || [];
  if (wardId) reports = reports.filter((r) => r.wardId === wardId);
  if (disease) reports = reports.filter((r) => r.disease.toLowerCase().includes(disease.toLowerCase()));
  if (status) reports = reports.filter((r) => r.status === status);
  res.json(reports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
});

app.post('/hospital-reports', (req, res) => {
  const { facilityName, wardId, wardName, disease, casesReported, reportingPeriod, reportingDate, notes } = req.body;

  const errors = [];
  if (!facilityName || facilityName.trim() === '') errors.push('facilityName is required');
  if (!wardId) errors.push('wardId is required');
  if (!disease || disease.trim() === '') errors.push('disease is required');
  const cases = Number(casesReported);
  if (isNaN(cases) || cases < 0) errors.push('casesReported must be a non-negative number');
  if (!reportingPeriod) errors.push('reportingPeriod is required (e.g. 2026-W39)');
  if (errors.length > 0) return res.status(400).json({ errors });

  const db = readDb();
  const ward = db.wards.find((w) => w.id === wardId);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  // Duplicate check: same facility + ward + disease + reporting period
  const duplicate = (db.hospitalReports || []).find(
    (r) => r.facilityId === wardId && r.disease.toLowerCase() === disease.trim().toLowerCase() && r.reportingPeriod === reportingPeriod
  );
  if (duplicate) {
    return res.status(409).json({ error: `A report for ${disease} in ${ward.name} for period ${reportingPeriod} already exists (ID: ${duplicate.id}). Submit a correction instead.` });
  }

  const report = {
    id: 'rpt_' + generateId(),
    facilityId: wardId,
    facilityName: facilityName.trim(),
    wardId,
    wardName: ward.name,
    disease: disease.trim().toLowerCase(),
    casesReported: cases,
    reportingPeriod,
    reportingDate: reportingDate || new Date().toISOString().slice(0, 10),
    notes: notes || '',
    submittedAt: new Date().toISOString(),
    status: 'accepted',
  };

  if (!db.hospitalReports) db.hospitalReports = [];
  db.hospitalReports.push(report);

  // Also update disease data
  if (!db.diseaseData) db.diseaseData = {};
  if (!db.diseaseData[wardId]) db.diseaseData[wardId] = {};
  const diseaseName = disease.trim().toLowerCase();
  db.diseaseData[wardId][diseaseName] = {
    ...(db.diseaseData[wardId][diseaseName] || {}),
    clinicVisits: cases,
    pharmacySales: (db.diseaseData[wardId][diseaseName] || {}).pharmacySales || 0,
    reportingPeriod,
    reportedBy: facilityName.trim(),
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  };

  // Regenerate alert
  const signals = ((db.signals || {})[wardId] || {}).signals || { clinicVisits: 0, pharmacySales: 0, pollution: 0, temperature: 0, mobility: 0 };
  const alert = generateAlert(signals, db.diseaseData[wardId]);
  if (!db.signals) db.signals = {};
  if (!db.signals[wardId]) db.signals[wardId] = { signals };
  db.signals[wardId].alert = alert;

  writeDb(db);
  res.status(201).json({ report, alert, message: `Report accepted. Alert for ${ward.name} updated.` });
});

// ── Trend history ─────────────────────────────────────────────────────────────
app.get('/trends/:wardId', (req, res) => {
  const { wardId } = req.params;
  const db = readDb();
  res.json({ wardId, trends: (db.trendHistory || {})[wardId] || {} });
});

app.get('/trends', (req, res) => {
  const db = readDb();
  res.json(db.trendHistory || {});
});

// ── Environmental layer ───────────────────────────────────────────────────────
app.get('/environmental', (req, res) => {
  const db = readDb();
  res.json({
    data: db.environmentalLayer || {},
    metadata: {
      source: 'Synthetic sample data for demonstration purposes only',
      note: 'Environmental indicators shown here are NOT real satellite observations. They are synthetic proxies generated for this demonstration. Real environmental data would require integration with verified remote-sensing APIs (e.g., USGS, Copernicus, NASA FIRMS).',
      acquisitionDate: '2026-10-01',
      fields: {
        floodRisk: 'Synthetic flood-risk category (high/medium/low)',
        surfaceWaterPct: 'Synthetic surface-water-coverage estimate (%)',
        aqiEstimate: 'Synthetic air quality index estimate',
      },
    },
  });
});

// ── All alerts (operational view) ─────────────────────────────────────────────
app.get('/all-alerts', (req, res) => {
  const db = readDb();
  const wards = db.wards || [];
  const alerts = wards.map((ward) => {
    const signals = ((db.signals || {})[ward.id] || {}).signals || {};
    const diseaseData = (db.diseaseData || {})[ward.id] || {};
    const alert = generateAlert(signals, diseaseData);
    return { wardId: ward.id, wardName: ward.name, zone: ward.zone || '', lat: ward.lat, lng: ward.lng, alert, diseaseData };
  });
  res.json(alerts);
});

// ── AI alerts ─────────────────────────────────────────────────────────────────
app.get('/ai-alerts/:wardId', async (req, res) => {
  const { wardId } = req.params;
  const db = readDb();
  const ward = (db.wards || []).find((w) => w.id === wardId);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  const signals = ((db.signals || {})[wardId] || {}).signals || { clinicVisits: 0, pharmacySales: 0, pollution: 0, temperature: 0, mobility: 0 };
  const diseaseData = (db.diseaseData || {})[wardId] || {};

  try {
    const result = await getAIPrediction(ward.name, signals, diseaseData);
    res.json(result);
  } catch (err) {
    console.error('AI alert route error:', err);
    res.status(500).json(generateLocalPrediction(ward.name, signals, diseaseData));
  }
});

// ── Analytics overview ────────────────────────────────────────────────────────
app.get('/analytics/overview', (req, res) => {
  res.json(computeCityAnalytics());
});

app.get('/analytics/disease-summary', (req, res) => {
  res.json(computeDiseaseSummary());
});

// ── Policy simulation ─────────────────────────────────────────────────────────
app.post('/simulate-policy', (req, res) => {
  const { cases, policy } = req.body || {};
  const numericCases = Number(cases);
  if (isNaN(numericCases) || numericCases < 0) return res.status(400).json({ error: 'cases must be a non-negative number' });

  const factors = { mobile_clinic: 0.35, mask_advisory: 0.25, traffic_restriction: 0.20 };
  const reductionFactor = factors[policy] || 0.15;
  const reducedCases = Math.round(numericCases * (1 - reductionFactor));
  const hospitalLoad = Math.min(100, Math.round(reducedCases * 0.2));
  const costSaved = Math.round((numericCases - reducedCases) * 500);

  const db = readDb();
  const result = { policy: policy || 'baseline', originalCases: numericCases, reducedCases, hospitalLoad, costSaved, timestamp: new Date().toISOString() };
  if (!db.simulationHistory) db.simulationHistory = [];
  db.simulationHistory.push(result);
  writeDb(db);

  res.json({ ...result, disclaimer: 'This is a scenario simulation tool. Figures are illustrative estimates based on simple reduction factors. They are not validated epidemiological forecasts.' });
});

app.get('/simulation-history', (req, res) => {
  const db = readDb();
  res.json(db.simulationHistory || []);
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.post('/users', (req, res) => {
  const { role, name } = req.body;
  if (!role || !['citizen', 'pharmacist', 'hospital', 'health_officer'].includes(role)) {
    return res.status(400).json({ error: 'Valid role required: citizen, pharmacist, hospital, health_officer' });
  }
  const db = readDb();
  if (!db.users) db.users = [];
  let user = db.users.find((u) => u.role === role && u.name === name);
  if (!user) {
    user = { id: generateId(), role, name: name || `${role}_${Date.now()}`, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
    db.users.push(user);
  } else {
    user.lastLogin = new Date().toISOString();
  }
  writeDb(db);
  res.json(user);
});

app.get('/users/:userId', (req, res) => {
  const db = readDb();
  const user = (db.users || []).find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/users/:userId/data', (req, res) => {
  const db = readDb();
  const userData = (db.userData || {})[req.params.userId] || { location: null, pollution: null, temperature: null, diseases: [], updatedAt: null };
  res.json(userData);
});

app.post('/users/:userId/data', (req, res) => {
  const { userId } = req.params;
  const { location, pollution, temperature, diseases } = req.body;
  const db = readDb();
  if (!(db.users || []).find((u) => u.id === userId)) return res.status(404).json({ error: 'User not found' });
  if (!db.userData) db.userData = {};
  db.userData[userId] = { location: location || null, pollution: pollution !== undefined ? Number(pollution) : null, temperature: temperature !== undefined ? Number(temperature) : null, diseases: Array.isArray(diseases) ? diseases : [], updatedAt: new Date().toISOString() };
  writeDb(db);
  res.json(db.userData[userId]);
});

// ── Chatbot ───────────────────────────────────────────────────────────────────
const SENTINEL_SYSTEM_CONTEXT =
  'You are "Sentinel", a helpful general-purpose AI assistant with a public-health focus. Answer questions on any topic: health, medicine, diseases, India and world public-health trends, science, education, technology, general knowledge, and everyday questions. ' +
  'Give a direct, useful answer first, then add context or steps when helpful. Do not refuse a normal question merely because it is outside Sentinel City. ' +
  'For current India-wide case counts, explain that live figures must be verified against official sources such as India\'s Ministry of Health and Family Welfare, IDSP/NDM, ICMR, WHO, or the relevant state health department; never invent a current number. ' +
  'Clearly distinguish official current figures, general medical knowledge, and Sentinel City synthetic demonstration data. ' +
  'Your personality: warm, humble, and honest. If you are unsure, say so openly. Use phrases like "Based on what I found", "According to recent sources", or "I believe, though please verify". ' +
  'For questions about Sentinel City platform data (wards, signals, alerts), mention that all platform data shown is synthetic demonstration data — not real patient records. ' +
  'When asked for medical remedies, provide only general, low-risk prevention or supportive-care guidance, never diagnose or prescribe, and always encourage a qualified healthcare professional for personal symptoms. ' +
  'Keep answers clear, well-structured, and free of unnecessary jargon. Prioritise accuracy above all else.';

async function searchWebFallback(message) {
  const query = message.trim();
  try {
    const searchUrl = new URL('https://api.duckduckgo.com/');
    searchUrl.search = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',
      no_redirect: '1',
      skip_disambig: '0',
    });
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Sentinel-City-Health-Assistant/1.0' },
    });
    if (!response.ok) throw new Error(`Web search returned HTTP ${response.status}`);
    const data = await response.json();
    const related = (data.RelatedTopics || [])
      .flatMap((topic) => topic.Topics || topic)
      .find((topic) => topic.Text && topic.FirstURL);
    const text = data.AbstractText || related?.Text;
    const source = data.AbstractURL || related?.FirstURL;
    if (text) {
      return `Based on a web search for "${query}":\n\n${text}\n\nSource: ${source}\n\nFor medical decisions or current case counts, verify this with an official health authority or qualified healthcare professional.`;
    }
  } catch (error) {
    console.warn('Web search fallback failed:', error.message);
  }
  return null;
}

async function chatLocalFallback(message) {
  const msg = (message || '').toLowerCase();
  const webAnswer = await searchWebFallback(message);
  if (webAnswer) return webAnswer;

  if ((msg.includes('india') || msg.includes('indian')) && (msg.includes('case') || msg.includes('cases') || msg.includes('disease') || msg.includes('outbreak'))) {
    return "I can help explain diseases and case trends across India. I do not have a live national surveillance feed in this demo, so I will not invent a current case count. For the latest verified numbers, check the Ministry of Health and Family Welfare, IDSP/NDM, ICMR, WHO, or your state health department. Tell me the disease, state, and date you want, and I can explain what the reported figures mean and what prevention steps are appropriate.";
  }
  if (msg.includes('ward') || msg.includes('signal') || msg.includes('alert')) {
    return "That's a great question. As best as I can tell from the platform data, Sentinel City tracks ward-level health signals — including clinic visits, pharmacy sales, pollution levels, temperature, and mobility. These are combined into alert levels for each ward. I'd encourage you to explore the Live Map view for a visual overview. Please keep in mind all data here is synthetic and for demonstration purposes only.";
  }
  if (msg.includes('dengue') || msg.includes('malaria') || msg.includes('mosquito')) {
    return "Thank you for asking about this. Mosquito-borne diseases like dengue, malaria, and chikungunya are among the conditions tracked across Chennai Metro wards. Based on what I know, some useful precautions include eliminating standing water, using mosquito repellents, wearing protective clothing at dawn and dusk, and sleeping under nets. If you or someone you know has symptoms like high fever or joint pain, please seek care at a local health facility — I'm not qualified to diagnose. All figures shown here are synthetic demonstration data.";
  }
  if (msg.includes('covid') || msg.includes('flu') || msg.includes('respiratory')) {
    return "Respiratory illness signals are monitored through aggregated clinic and pharmacy data across wards. From what I understand, general prevention includes wearing masks in crowded spaces, frequent handwashing, staying home when symptomatic, and following local vaccination guidance. I want to be transparent — I'm working from synthetic demo data, not live surveillance. For anything concerning your personal health, please consult a qualified healthcare professional.";
  }
  if (msg.includes('water') || msg.includes('typhoid') || msg.includes('cholera') || msg.includes('gastro') || msg.includes('diarrhea')) {
    return "Water-borne disease indicators are tracked through facility-level reports in this platform. Based on established public health guidance, some key steps include drinking only boiled or treated water, washing hands before eating and after using the toilet, and seeking early medical care for persistent diarrhoea or dehydration. I'd encourage you to report any suspected water-contamination to local authorities. As always, all data here is synthetic — please verify critical concerns with a healthcare provider.";
  }
  if (msg.includes('environment') || msg.includes('pollution') || msg.includes('aqi') || msg.includes('flood')) {
    return "Environmental risk is an important part of what this platform monitors. The City Intelligence panel shows synthetic indicators like estimated flood risk, air quality index (AQI), and surface water coverage per ward. I should be honest — these are synthetic proxies for demonstration, not real satellite observations. For actual environmental data, authoritative sources like the Tamil Nadu Pollution Control Board or IMD would be more reliable.";
  }
  if (msg.includes('hospital') || msg.includes('report') || msg.includes('facility')) {
    return "Hospitals and health facilities can submit aggregated case reports through the Reporting Portal in this platform. These reports feed into ward-level alert calculations. I believe the reporting is designed for authorised health staff — citizens would typically not submit reports directly. I should clarify that all data in this demo is synthetic and does not represent real hospital records.";
  }
  if (msg.includes('prevent') || msg.includes('safe') || msg.includes('protect') || msg.includes('tip')) {
    return "I'm happy to share some general prevention guidance, though please treat these as educational pointers rather than medical advice:\n\n• Wash hands frequently with soap and water\n• Keep surroundings clean and free of stagnant water\n• Eat hygienically prepared food and drink safe water\n• Stay updated on local health advisories\n• Seek medical attention early if symptoms appear\n\nFor personalised advice, a qualified healthcare provider is always the best resource.";
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
    return "Hello! I'm Sentinel — a humble AI health assistant for Sentinel City, the Chennai Metro public health intelligence prototype. I'll do my best to help you understand ward alerts, disease trends, environmental signals, and general prevention tips. I should mention upfront that all platform data is synthetic and I'm not a substitute for professional medical advice. What would you like to know?";
  }
  if (msg.includes('thank')) {
    return "You're very welcome! I'm glad I could help, even if only a little. If you have more questions about ward health signals, disease trends, or prevention — feel free to ask anytime.";
  }

  return `I could not find a reliable web result for "${message.trim()}". Please rephrase the question or include a disease, place, or topic. For health questions, I can explain symptoms and prevention, but I cannot diagnose or prescribe.`;
}

app.post('/chat', async (req, res) => {
  const { message, history = [], dataContext } = req.body;
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  try {
    const chatHistory = Array.isArray(history) ? history : [];

    // On first turn, inject system context as a seeded user/model exchange
    // so Gemini knows its persona and scope for the whole conversation
    const currentDataContext = dataContext || computeDiseaseSummary();
    const dataContextPrompt = `\n\nCurrent Sentinel City disease intelligence snapshot (use this only for Sentinel City ward, state, and city questions):\n${JSON.stringify(currentDataContext)}\nDo not call these counts confirmed cases. Explain red/yellow/green/ND categories using the supplied legend. This snapshot is not India-wide surveillance data.`;
    const fullHistory = chatHistory.length === 0
      ? [
          {
            role: 'user',
            parts: [{ text: SENTINEL_SYSTEM_CONTEXT + dataContextPrompt + '\n\nPlease acknowledge your role and confirm you are ready to answer any question the user asks.' }],
          },
          {
            role: 'model',
            parts: [{ text: "Understood. I'm Sentinel — a humble, knowledgeable AI assistant here to help with any question you have. Whether it's public health, disease information, general knowledge, science, or anything else, I'll do my best to give you an accurate, honest answer. I'll always be upfront when I'm unsure, and I'll remind you when something relates to Sentinel City's synthetic demo data. What would you like to know?" }],
          },
        ]
      : chatHistory;

    if (!process.env.GEMINI_API_KEY) {
      const reply = await chatLocalFallback(message);
      return res.json({ reply, source: 'web-search-fallback' });
    }

    const chat = chatModel.startChat({ history: fullHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();
    return res.json({ reply, source: 'gemini-google-search-grounded' });
  } catch (err) {
    console.warn('Gemini chat error, using local fallback:', err.message);
    const reply = await chatLocalFallback(message);
    return res.json({ reply, source: 'web-search-fallback', error: 'AI service unavailable; using web search fallback.' });
  }
});

// ── API documentation ─────────────────────────────────────────────────────────
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Sentinel City API',
    version: '2.0',
    description: 'REST API for the Sentinel City public health intelligence platform (Chennai Metro prototype). All data returned is synthetic demonstration data — not real patient records or validated epidemiological data.',
    baseUrl: 'http://localhost:5000',
    dataNote: 'SYNTHETIC DEMONSTRATION DATA — not for clinical or operational public-health use.',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Health check — confirms the backend is running.',
        response: '{ status, version, dataNote }',
      },
      {
        method: 'GET',
        path: '/wards',
        description: 'List all registered wards with geographic and population metadata.',
        response: 'Array<{ id, name, lat, lng, zone, population, facilities }>',
      },
      {
        method: 'POST',
        path: '/wards',
        description: 'Create a new ward. Requires name, lat, lng.',
        body: '{ name, lat, lng, zone?, population?, facilities? }',
        response: '{ id, name, lat, lng, zone, population, facilities }',
      },
      {
        method: 'GET',
        path: '/signals/:wardId',
        description: 'Get the latest aggregated signals and computed alert for a ward.',
        response: '{ wardId, signals: { clinicVisits, pharmacySales, pollution, temperature, mobility }, alert, diseaseData }',
      },
      {
        method: 'POST',
        path: '/signals/:wardId',
        description: 'Submit or update aggregated signal data for a ward.',
        body: '{ clinicVisits, pharmacySales, pollution, temperature, mobility }',
        response: '{ wardId, signals, alert }',
      },
      {
        method: 'GET',
        path: '/disease-data/:wardId',
        description: 'Get all aggregated disease data for a ward.',
        response: '{ wardId, diseases: { [diseaseName]: { clinicVisits, pharmacySales, reportingPeriod, reportedBy, notes, updatedAt } } }',
      },
      {
        method: 'POST',
        path: '/disease-data/:wardId',
        description: 'Submit or update aggregated disease data for a ward.',
        body: '{ disease, clinicVisits, pharmacySales, reportingPeriod?, notes?, reportedBy? }',
        response: '{ wardId, disease, data, alert }',
      },
      {
        method: 'GET',
        path: '/hospital-reports',
        description: 'List all hospital/facility reports. Supports query filters: wardId, disease, status.',
        queryParams: '?wardId=&disease=&status=',
        response: 'Array<{ id, facilityName, wardId, wardName, disease, casesReported, reportingPeriod, reportingDate, notes, submittedAt, status }>',
      },
      {
        method: 'POST',
        path: '/hospital-reports',
        description: 'Submit an aggregated case report from a facility. Prevents duplicates for same facility+ward+disease+period.',
        body: '{ facilityName, wardId, wardName, disease, casesReported, reportingPeriod, reportingDate?, notes? }',
        response: '{ report, alert, message }',
      },
      {
        method: 'GET',
        path: '/trends/:wardId',
        description: 'Get historical trend data for a specific ward.',
        response: '{ wardId, trends: { [diseaseName]: [...] } }',
      },
      {
        method: 'GET',
        path: '/trends',
        description: 'Get historical trend data for all wards.',
        response: '{ [wardId]: { [diseaseName]: [...] } }',
      },
      {
        method: 'GET',
        path: '/environmental',
        description: 'Get synthetic environmental risk layer data (flood risk, AQI, surface water). Note: synthetic proxies only.',
        response: '{ data: { [wardId]: { floodRisk, surfaceWaterPct, aqiEstimate } }, metadata }',
      },
      {
        method: 'GET',
        path: '/all-alerts',
        description: 'Get heuristic-computed alert levels for all wards (operational overview).',
        response: 'Array<{ wardId, wardName, zone, lat, lng, alert: { level, disease, reason, alertScore }, diseaseData }>',
      },
      {
        method: 'GET',
        path: '/ai-alerts/:wardId',
        description: 'Get a Gemini AI-generated prediction and prevention recommendations for a ward. Falls back to local heuristic if AI is unavailable.',
        response: '{ prediction, prevention: string[], risk: "High"|"Medium"|"Low", disclaimer }',
      },
      {
        method: 'GET',
        path: '/analytics/overview',
        description: 'Get city-wide analytics: flagged wards, respiratory complaint totals, spread risk scores, and baseline comparisons.',
        response: '{ baseline, totalAggregatedCases, totalWards, flaggedWards, methodology, dataNote, wards: [...] }',
      },
      {
        method: 'POST',
        path: '/simulate-policy',
        description: 'Run a simple policy-impact scenario simulation. Returns estimated case reduction and cost savings.',
        body: '{ cases: number, policy: "mobile_clinic"|"mask_advisory"|"traffic_restriction" }',
        response: '{ policy, originalCases, reducedCases, hospitalLoad, costSaved, timestamp, disclaimer }',
      },
      {
        method: 'GET',
        path: '/simulation-history',
        description: 'List all previously run policy simulations.',
        response: 'Array<{ policy, originalCases, reducedCases, hospitalLoad, costSaved, timestamp }>',
      },
      {
        method: 'POST',
        path: '/users',
        description: 'Create or retrieve a user by role and name.',
        body: '{ role: "citizen"|"pharmacist"|"hospital"|"health_officer", name? }',
        response: '{ id, role, name, createdAt, lastLogin }',
      },
      {
        method: 'GET',
        path: '/users/:userId',
        description: 'Get a user record by ID.',
        response: '{ id, role, name, createdAt, lastLogin }',
      },
      {
        method: 'GET',
        path: '/users/:userId/data',
        description: 'Get stored personal health context data for a user.',
        response: '{ location, pollution, temperature, diseases, updatedAt }',
      },
      {
        method: 'POST',
        path: '/users/:userId/data',
        description: 'Save personal health context data for a user.',
        body: '{ location?, pollution?, temperature?, diseases? }',
        response: '{ location, pollution, temperature, diseases, updatedAt }',
      },
      {
        method: 'POST',
        path: '/chat',
        description: 'Multi-turn AI chatbot powered by Gemini (gemini-2.0-flash-lite). Accepts conversation history for context. Falls back to keyword-based local responses if AI is unavailable.',
        body: '{ message: string, history?: Array<{ role: "user"|"model", parts: [{ text: string }] }> }',
        response: '{ reply: string, error?: string }',
      },
      {
        method: 'GET',
        path: '/api-docs',
        description: 'Returns this API documentation object.',
        response: '{ title, version, description, baseUrl, dataNote, endpoints: [...] }',
      },
    ],
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Sentinel City backend v2.0 listening on port ${PORT}`);
  console.log('Data note: SYNTHETIC DEMONSTRATION DATA in use');
});
