import React, { useEffect, useState } from 'react';
import { getAllAlerts } from '../api';

const levelStyles = {
  high:   'bg-red-950/40 border-red-500/50 text-red-200',
  medium: 'bg-amber-950/40 border-amber-500/50 text-amber-200',
  normal: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200',
};

const levelDot = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  normal: 'bg-emerald-500',
};

const SignalToActionTimeline = () => {
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const fetchAlerts = async () => {
      try {
        setError('');
        const res = await getAllAlerts();
        if (!cancelled) {
          setAlerts(res.data || []);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) setError('Unable to fetch latest alerts from backend.');
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const allDiseases = Array.from(
    new Set(alerts.flatMap((a) => Object.keys(a.diseaseData || {})))
  ).sort();

  const filteredAlerts = alerts
    .filter((a) => levelFilter === 'all' || (a.alert?.level || 'normal') === levelFilter)
    .filter((a) => diseaseFilter === 'all' || Object.keys(a.diseaseData || {}).includes(diseaseFilter))
    .sort((a, b) => {
      const ord = { high: 0, medium: 1, normal: 2 };
      return (ord[a.alert?.level] ?? 2) - (ord[b.alert?.level] ?? 2);
    });

  const highCount = alerts.filter((a) => a.alert?.level === 'high').length;
  const medCount = alerts.filter((a) => a.alert?.level === 'medium').length;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Signal-to-Action Timeline</h2>
          <p className="text-xs text-gray-400">
            Live alerts across {alerts.length} monitored wards · auto-refreshes every 10s
          </p>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          <div className="text-[10px] text-gray-500">Last updated</div>
          <div className="font-semibold text-accentSoft">
            {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background rounded border border-red-500/30 px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase">High alerts</div>
          <div className="text-lg font-bold text-red-400">{highCount}</div>
        </div>
        <div className="bg-background rounded border border-amber-500/30 px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Elevated</div>
          <div className="text-lg font-bold text-amber-300">{medCount}</div>
        </div>
        <div className="bg-background rounded border border-emerald-500/30 px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Normal</div>
          <div className="text-lg font-bold text-emerald-400">{alerts.length - highCount - medCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="app-input rounded px-2 py-1 text-[11px] max-w-[130px]"
          aria-label="Filter by alert level"
        >
          <option value="all">All levels</option>
          <option value="high">High Alert</option>
          <option value="medium">Elevated</option>
          <option value="normal">Normal</option>
        </select>
        <select
          value={diseaseFilter}
          onChange={(e) => setDiseaseFilter(e.target.value)}
          className="app-input rounded px-2 py-1 text-[11px] max-w-[160px]"
          aria-label="Filter by disease"
        >
          <option value="all">All diseases</option>
          {allDiseases.map((d) => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-[11px] text-danger border border-danger/40 bg-danger/5 rounded px-3 py-2">{error}</div>
      )}

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-10">No alerts match the current filters.</div>
        ) : (
          filteredAlerts.map((ward) => {
            const level = ward.alert?.level || 'normal';
            const diseases = Object.entries(ward.diseaseData || {})
              .sort((a, b) => (b[1].clinicVisits || 0) - (a[1].clinicVisits || 0))
              .slice(0, 3);

            return (
              <div key={ward.wardId} className={`rounded-lg border px-3 py-3 ${levelStyles[level] || levelStyles.normal}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${levelDot[level] || levelDot.normal}`} />
                    <span className="text-xs font-semibold text-gray-100">{ward.wardName}</span>
                    {ward.zone && <span className="text-[10px] text-gray-500">{ward.zone}</span>}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    level === 'high' ? 'border-red-500/50 text-red-300' :
                    level === 'medium' ? 'border-amber-500/50 text-amber-300' :
                    'border-emerald-500/40 text-emerald-400'
                  }`}>
                    {level === 'high' ? 'High Alert' : level === 'medium' ? 'Elevated' : 'Normal'}
                  </span>
                </div>

                {/* Alert reason */}
                {ward.alert?.reason && (
                  <p className="text-[11px] opacity-90 leading-relaxed mb-2 ml-4">{ward.alert.reason}</p>
                )}

                {/* Diseases */}
                {diseases.length > 0 && (
                  <div className="ml-4 flex flex-wrap gap-2">
                    {diseases.map(([name, d]) => (
                      <span key={name} className="inline-flex items-center gap-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                        <span className="capitalize font-medium">{name}</span>
                        <span className="opacity-60">· {d.clinicVisits || 0} reports</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Verification note for high/medium */}
                {level !== 'normal' && (
                  <div className="ml-4 mt-2 text-[10px] opacity-60 italic">
                    ⚠ This is a heuristic flag — human verification recommended before public-health action.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-gray-500 border-t border-slate-800 pt-2">
        Alert thresholds: combined reports &gt; 400 = High · &gt; 200 = Elevated. SYNTHETIC DATA. Not medically validated.
      </div>
    </div>
  );
};

export default SignalToActionTimeline;
