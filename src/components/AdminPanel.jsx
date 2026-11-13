import React, { useEffect, useState } from 'react';
import { getWards, submitHospitalReport, getHospitalReports, addDiseaseData, setSignalsForWard } from '../api';

const DISEASES = [
  'Dengue', 'Malaria', 'Chikungunya', 'COVID-19', 'Influenza / Flu',
  'Typhoid', 'Gastroenteritis', 'Tuberculosis', 'Respiratory Infection',
  'Viral Fever', 'Nipah Virus', 'Other',
];

const STATUS_STYLES = {
  accepted:     'bg-emerald-900/30 text-emerald-300 border-emerald-500/40',
  under_review: 'bg-amber-900/30 text-amber-300 border-amber-500/40',
  rejected:     'bg-red-900/30 text-red-300 border-red-500/40',
};

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

const AdminPanel = ({ user }) => {
  const [wards, setWards] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingWards, setLoadingWards] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState('report');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [formErrors, setFormErrors] = useState([]);

  const [form, setForm] = useState({
    facilityName: user?.name || '',
    wardId: '',
    disease: '',
    customDisease: '',
    casesReported: '',
    reportingPeriod: getCurrentWeek(),
    reportingDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Signals form
  const [sigForm, setSigForm] = useState({
    clinicVisits: '', pharmacySales: '', pollution: '', temperature: '', mobility: ''
  });
  const [sigFeedback, setSigFeedback] = useState('');

  const loadWards = async () => {
    setLoadingWards(true);
    try {
      const res = await getWards();
      setWards(res.data || []);
    } catch { /* silent */ }
    finally { setLoadingWards(false); }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await getHospitalReports();
      setReports(res.data || []);
    } catch { /* silent */ }
    finally { setLoadingReports(false); }
  };

  useEffect(() => {
    loadWards();
    loadReports();
  }, []);

  const validate = () => {
    const errs = [];
    if (!form.facilityName.trim()) errs.push('Facility name is required.');
    if (!form.wardId) errs.push('Ward / zone is required.');
    const disease = form.disease === 'Other' ? form.customDisease : form.disease;
    if (!disease.trim()) errs.push('Disease name is required.');
    const cases = Number(form.casesReported);
    if (isNaN(cases) || cases < 0) errs.push('Cases reported must be a non-negative number.');
    if (!form.reportingPeriod) errs.push('Reporting period is required.');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setFormErrors([]);
    const errs = validate();
    if (errs.length > 0) { setFormErrors(errs); return; }

    setSubmitting(true);
    const disease = form.disease === 'Other' ? form.customDisease : form.disease;
    try {
      await submitHospitalReport({
        facilityName: form.facilityName.trim(),
        wardId: form.wardId,
        disease: disease.trim(),
        casesReported: Number(form.casesReported),
        reportingPeriod: form.reportingPeriod,
        reportingDate: form.reportingDate,
        notes: form.notes.trim(),
      });
      setFeedback(`✓ Report submitted successfully for ${disease} in ${wards.find(w=>w.id===form.wardId)?.name || ''}. Alert levels updated.`);
      setFeedbackType('success');
      setForm(f => ({ ...f, casesReported: '', notes: '', disease: '' }));
      loadReports();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.errors?.join(', ') || 'Submission failed.';
      setFeedback(msg);
      setFeedbackType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSigSubmit = async (e) => {
    e.preventDefault();
    setSigFeedback('');
    if (!form.wardId) { setSigFeedback('Select a ward first.'); return; }
    try {
      await setSignalsForWard(form.wardId, {
        clinicVisits: Number(sigForm.clinicVisits) || 0,
        pharmacySales: Number(sigForm.pharmacySales) || 0,
        pollution: Number(sigForm.pollution) || 0,
        temperature: Number(sigForm.temperature) || 0,
        mobility: Number(sigForm.mobility) || 0,
      });
      setSigFeedback('✓ Environmental signals updated for ward.');
    } catch { setSigFeedback('Failed to update signals.'); }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Hospital Reporting Portal</h2>
          <p className="text-[11px] text-gray-400">
            Logged in as: <span className="font-medium text-gray-200">{user?.name || 'Unknown'}</span>
            {' · '}Role: <span className="text-accentSoft capitalize">{user?.role || '—'}</span>
          </p>
        </div>
        <div className="text-[10px] text-gray-500 text-right">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-500/40 bg-amber-900/20 text-amber-300">
            ⚠ SYNTHETIC DEMO DATA
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {[
          { id: 'report', label: 'Submit Report' },
          { id: 'history', label: `Report History (${reports.length})` },
          { id: 'signals', label: 'Update Signals' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-t border-b-2 transition-colors ${
              activeTab === t.id ? 'border-accentSoft text-accentSoft' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBMIT REPORT TAB */}
      {activeTab === 'report' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-950/20 border border-blue-500/30 rounded px-3 py-2 text-[11px] text-blue-200">
            Submit aggregated (not individual) disease case counts reported by your facility for a specific ward and reporting period.
          </div>

          {formErrors.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/40 rounded px-3 py-2">
              <ul className="space-y-0.5">
                {formErrors.map((e, i) => (
                  <li key={i} className="text-[11px] text-red-300">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback && (
            <div className={`rounded px-3 py-2 text-[11px] border ${
              feedbackType === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/30 border-red-500/40 text-red-300'
            }`}>
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Facility name *</label>
              <input
                type="text"
                value={form.facilityName}
                onChange={(e) => setForm(f => ({ ...f, facilityName: e.target.value }))}
                className="app-input"
                placeholder="e.g. Central Hospital Delhi"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Ward / Zone *</label>
              <select
                value={form.wardId}
                onChange={(e) => setForm(f => ({ ...f, wardId: e.target.value }))}
                className="app-input"
              >
                <option value="">— Select ward —</option>
                {loadingWards ? (
                  <option disabled>Loading…</option>
                ) : (
                  wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}{w.zone ? ` (${w.zone})` : ''}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Disease *</label>
              <select
                value={form.disease}
                onChange={(e) => setForm(f => ({ ...f, disease: e.target.value }))}
                className="app-input"
              >
                <option value="">— Select disease —</option>
                {DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {form.disease === 'Other' && (
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Specify disease *</label>
                <input
                  type="text"
                  value={form.customDisease}
                  onChange={(e) => setForm(f => ({ ...f, customDisease: e.target.value }))}
                  className="app-input"
                  placeholder="Enter disease name"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Aggregated cases reported *</label>
              <input
                type="number"
                min="0"
                value={form.casesReported}
                onChange={(e) => setForm(f => ({ ...f, casesReported: e.target.value }))}
                className="app-input"
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Reporting period * (ISO week)</label>
              <input
                type="text"
                value={form.reportingPeriod}
                onChange={(e) => setForm(f => ({ ...f, reportingPeriod: e.target.value }))}
                className="app-input"
                placeholder="e.g. 2026-W39"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Report date</label>
              <input
                type="date"
                value={form.reportingDate}
                onChange={(e) => setForm(f => ({ ...f, reportingDate: e.target.value }))}
                className="app-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Notes / observations (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="app-input h-20 resize-none"
              placeholder="Any contextual notes about this report period…"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500">* Required fields. Duplicate reports for the same ward + disease + period are rejected.</p>
            <button
              type="submit"
              disabled={submitting}
              className="app-button-primary px-4 py-2"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}

      {/* REPORT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">{reports.length} reports in system · sorted by most recent</p>
            <button onClick={loadReports} className="app-button-ghost px-2 py-1 text-[11px]">↺ Refresh</button>
          </div>
          {loadingReports ? (
            <div className="text-xs text-gray-400 animate-pulse text-center py-6">Loading reports…</div>
          ) : reports.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-8">No reports submitted yet.</div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
              {reports.map((r) => (
                <div key={r.id} className="bg-background rounded border border-slate-800 px-3 py-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium text-gray-100 capitalize">{r.disease}</span>
                      <span className="text-[11px] text-gray-400 ml-2">— {r.wardName}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[r.status] || STATUS_STYLES.under_review}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-300 mb-1">
                    <span>Cases: <strong>{r.casesReported}</strong></span>
                    <span>Period: <strong>{r.reportingPeriod}</strong></span>
                    <span>Date: <strong>{r.reportingDate}</strong></span>
                  </div>
                  {r.notes && (
                    <div className="text-[11px] text-gray-400 italic">{r.notes}</div>
                  )}
                  <div className="text-[10px] text-gray-600 mt-1">
                    {r.facilityName} · ID: {r.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPDATE SIGNALS TAB */}
      {activeTab === 'signals' && (
        <form onSubmit={handleSigSubmit} className="space-y-4">
          <div className="bg-background rounded border border-slate-800 px-3 py-2 text-[11px] text-gray-400">
            Update environmental and health-system signal data for a ward. These supplement disease case reports.
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Ward *</label>
            <select
              value={form.wardId}
              onChange={(e) => setForm(f => ({ ...f, wardId: e.target.value }))}
              className="app-input"
            >
              <option value="">— Select ward —</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'clinicVisits', label: 'Clinic visits (total)' },
              { key: 'pharmacySales', label: 'Pharmacy sales (total)' },
              { key: 'pollution', label: 'AQI estimate' },
              { key: 'temperature', label: 'Avg. temperature (°C)' },
              { key: 'mobility', label: 'Mobility index (0–100)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[11px] text-gray-400 mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={sigForm[key]}
                  onChange={(e) => setSigForm(f => ({ ...f, [key]: e.target.value }))}
                  className="app-input"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {sigFeedback && (
            <div className={`rounded px-3 py-2 text-[11px] border ${
              sigFeedback.startsWith('✓')
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/30 border-red-500/40 text-red-300'
            }`}>
              {sigFeedback}
            </div>
          )}

          <button type="submit" className="app-button-ghost px-4 py-2">Update Signals</button>
        </form>
      )}
    </div>
  );
};

export default AdminPanel;
