import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getSignalsForWard, getTrends, getEnvironmentalData } from '../api';
import {
  getGuidelinesForDisease,
  getDiseaseDisplayName,
  getDiseaseSeverity,
  getSeverityColor,
  normalizeDiseaseName,
} from '../utils/diseaseGuidelines';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AlertBadge = ({ level }) => {
  const cfg = {
    high:   { label: '⚠ High Alert',  cls: 'bg-red-900/40 text-red-300 border-red-500/50' },
    medium: { label: '▲ Elevated',    cls: 'bg-amber-900/40 text-amber-300 border-amber-500/50' },
    normal: { label: '✓ Normal',      cls: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40' },
  };
  const { label, cls } = cfg[level] || cfg.normal;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
};

const MetricPill = ({ label, value, unit = '' }) => (
  <div className="bg-background rounded border border-slate-800 px-3 py-2 flex flex-col gap-0.5">
    <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-100">
      {value ?? '—'}{unit && <span className="text-[11px] text-gray-400 ml-0.5">{unit}</span>}
    </span>
  </div>
);

const Dashboard = ({ selectedWard }) => {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [envData, setEnvData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!selectedWard) return;
    setLoading(true);
    setError('');
    setActiveTab('overview');

    Promise.all([
      getSignalsForWard(selectedWard.id),
      getTrends(selectedWard.id),
      getEnvironmentalData(),
    ])
      .then(([signalRes, trendRes, envRes]) => {
        setData(signalRes.data || null);
        setTrends(trendRes.data?.trends || null);
        const allEnv = envRes.data?.data || {};
        setEnvData(allEnv[selectedWard.id] || null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load ward data. Check backend connection.');
      })
      .finally(() => setLoading(false));
  }, [selectedWard]);

  const detectedDiseases = useMemo(() => {
    if (!data) return [];
    const diseaseSet = new Set();
    if (data.alert?.disease) diseaseSet.add(normalizeDiseaseName(data.alert.disease));
    if (data.diseaseData) Object.keys(data.diseaseData).forEach((d) => diseaseSet.add(normalizeDiseaseName(d)));
    return Array.from(diseaseSet).filter(Boolean);
  }, [data]);

  // Build trend chart data for the top disease
  const trendChartData = useMemo(() => {
    if (!trends) return null;
    const entries = Object.entries(trends);
    if (entries.length === 0) return null;
    const [diseaseName, weeks] = entries[0];
    const labels = weeks.map((w) => w.week.replace('2026-', ''));
    const values = weeks.map((w) => w.cases);
    return {
      diseaseName,
      chart: {
        labels,
        datasets: [
          {
            label: `${diseaseName} reported cases`,
            data: values,
            borderColor: '#5bc0be',
            backgroundColor: 'rgba(91,192,190,0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#5bc0be',
          },
        ],
      },
    };
  }, [trends]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2541',
        borderColor: '#3a506b',
        borderWidth: 1,
        titleColor: '#e5e7eb',
        bodyColor: '#9ca3af',
      },
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 10 } } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 10 } }, beginAtZero: true },
    },
  };

  if (!selectedWard) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-gray-500 py-8">
        <span className="text-2xl">🗺</span>
        <p className="text-xs">Select a ward on the map to view detailed health signals.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Ward header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">{selectedWard.name}</h2>
          <p className="text-[11px] text-gray-400">Ward risk console · Reporting period: 2026-W39</p>
        </div>
        {data?.alert && <AlertBadge level={data.alert.level} />}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-400 animate-pulse">Loading ward data…</div>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-danger border border-danger/40 bg-danger/5 rounded px-3 py-2">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-800 -mb-1">
            {['overview', 'trends', 'environment', 'guidelines'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-t border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-accentSoft text-accentSoft'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              {/* Alert explainer */}
              {data.alert?.reason && (
                <div className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${
                  data.alert.level === 'high'
                    ? 'bg-red-950/30 border-red-500/40 text-red-200'
                    : data.alert.level === 'medium'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                }`}>
                  <div className="font-semibold mb-1">Alert explanation</div>
                  <p>{data.alert.reason}</p>
                  <p className="mt-2 text-[10px] opacity-70">{data.alert.comparisonNote}</p>
                </div>
              )}

              {/* Signal metrics */}
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Aggregated signals (facility-reported)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <MetricPill label="Clinic visits" value={data.signals?.clinicVisits} />
                  <MetricPill label="Pharmacy sales" value={data.signals?.pharmacySales} />
                  <MetricPill label="AQI estimate" value={data.signals?.pollution} />
                  <MetricPill label="Temperature" value={data.signals?.temperature} unit="°C" />
                  <MetricPill label="Mobility index" value={data.signals?.mobility} />
                  <MetricPill label="Alert score" value={data.alert?.alertScore} unit="/100" />
                </div>
              </div>

              {/* Disease breakdown */}
              {data.diseaseData && Object.keys(data.diseaseData).length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Reported disease counts
                  </div>
                  <div className="space-y-2">
                    {Object.entries(data.diseaseData)
                      .sort((a, b) => (b[1].clinicVisits || 0) - (a[1].clinicVisits || 0))
                      .map(([name, d]) => (
                        <div key={name} className="bg-background rounded border border-slate-800 px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-100 capitalize">{name}</span>
                            <span className="text-[10px] text-gray-400">{d.reportingPeriod || 'W39'}</span>
                          </div>
                          <div className="flex gap-4 text-[11px] text-gray-300">
                            <span>Clinic: <strong>{d.clinicVisits || 0}</strong></span>
                            <span>Pharmacy: <strong>{d.pharmacySales || 0}</strong></span>
                          </div>
                          {d.reportedBy && (
                            <div className="text-[10px] text-gray-500 mt-0.5">Source: {d.reportedBy}</div>
                          )}
                          {/* Progress bar */}
                          <div className="mt-1.5 w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accentSoft"
                              style={{ width: `${Math.min(100, ((d.clinicVisits || 0) / 400) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRENDS TAB */}
          {activeTab === 'trends' && (
            <div className="flex flex-col gap-3">
              {trendChartData ? (
                <>
                  <div className="text-[11px] text-gray-400">
                    5-week trend for{' '}
                    <span className="text-gray-100 font-medium capitalize">{trendChartData.diseaseName}</span>
                    {' '}in {selectedWard.name}
                  </div>
                  <div className="h-[200px]">
                    <Line data={trendChartData.chart} options={chartOptions} />
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Source: aggregated facility reports. SYNTHETIC data for demonstration. Weeks shown are 2026-W35 to W39.
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500 text-center py-8">
                  No trend history available for this ward in the current dataset.
                </div>
              )}

              {/* Multi-disease summary */}
              {data.diseaseData && Object.keys(data.diseaseData).length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-2">
                    All diseases — current period vs. threshold
                  </div>
                  {Object.entries(data.diseaseData).map(([name, d]) => {
                    const total = (d.clinicVisits || 0) + (d.pharmacySales || 0);
                    const pct = Math.min(100, (total / 800) * 100);
                    const color = total > 600 ? '#ef4444' : total > 300 ? '#f59e0b' : '#10b981';
                    return (
                      <div key={name} className="mb-2">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-200 capitalize">{name}</span>
                          <span style={{ color }}>{total} reports</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-[10px] text-gray-500 mt-1">
                    Threshold bar: High alert ≥ 600 combined reports · Medium ≥ 300
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENVIRONMENT TAB */}
          {activeTab === 'environment' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🛰</span>
                  <span className="text-xs font-semibold text-blue-300">
                    Environmental Indicators — SYNTHETIC DATA
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/70 mb-3">
                  The values below are illustrative synthetic proxies for demonstration purposes only.
                  They are not derived from real satellite remote-sensing observations. Environmental indicators
                  provide contextual background and do not establish a causal link with reported disease counts.
                </p>
                {envData ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background rounded border border-slate-800 px-3 py-2">
                      <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Flood risk category</span>
                      <span className={`text-sm font-semibold capitalize ${
                        envData.floodRisk === 'high' ? 'text-blue-400' : envData.floodRisk === 'medium' ? 'text-blue-300' : 'text-gray-300'
                      }`}>{envData.floodRisk || '—'}</span>
                    </div>
                    <div className="bg-background rounded border border-slate-800 px-3 py-2">
                      <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Surface water est.</span>
                      <span className="text-sm font-semibold text-gray-100">{envData.surfaceWaterPct ?? '—'}<span className="text-xs text-gray-400"> %</span></span>
                    </div>
                    <div className="bg-background rounded border border-slate-800 px-3 py-2">
                      <span className="text-[10px] text-gray-500 uppercase block mb-0.5">AQI estimate</span>
                      <span className={`text-sm font-semibold ${
                        (envData.aqiEstimate || 0) > 100 ? 'text-red-400' : (envData.aqiEstimate || 0) > 60 ? 'text-amber-300' : 'text-emerald-400'
                      }`}>{envData.aqiEstimate || '—'}</span>
                    </div>
                    <div className="bg-background rounded border border-slate-800 px-3 py-2">
                      <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Context note</span>
                      <span className="text-[11px] text-gray-300">{envData.note || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No environmental data for this ward.</div>
                )}
                <div className="mt-3 text-[10px] text-gray-500 border-t border-slate-800 pt-2">
                  Real environmental integration would require verified remote-sensing APIs (e.g., Copernicus, NASA FIRMS, USGS).
                  Acquisition date: 2026-10-01 (SYNTHETIC).
                </div>
              </div>
            </div>
          )}

          {/* GUIDELINES TAB */}
          {activeTab === 'guidelines' && (
            <div className="flex flex-col gap-3">
              {detectedDiseases.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-8">
                  No disease data reported for this ward yet.
                </div>
              ) : (
                detectedDiseases.map((disease) => {
                  const displayName = getDiseaseDisplayName(disease) || disease;
                  const severity = getDiseaseSeverity(disease);
                  const guidelines = getGuidelinesForDisease(disease) || [];
                  const severityColor = getSeverityColor(severity);
                  return (
                    <div key={disease} className="bg-background rounded border border-slate-800 px-3 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-100">{displayName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${severityColor}`}>
                          {severity}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {guidelines.slice(0, 6).map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-gray-300">
                            <span className="text-accentSoft mt-0.5 shrink-0">›</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
              <div className="text-[10px] text-gray-500 border-t border-slate-800 pt-2 mt-1">
                Guidelines are general public-health recommendations. Always follow guidance from local health authorities.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
