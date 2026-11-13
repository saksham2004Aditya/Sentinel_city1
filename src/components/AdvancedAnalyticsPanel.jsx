import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getAnalyticsOverview, getAllTrends } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ZONE_COLORS = { 'Central': '#5bc0be', 'South': '#60a5fa', 'West': '#a78bfa', 'South-West': '#f59e0b', 'South-East': '#fb923c', 'North': '#34d399', 'North-East': '#f87171', 'Central-South': '#c084fc', 'North-Industrial': '#94a3b8' };

const AdvancedAnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('anomalies');
  const [selectedWardId, setSelectedWardId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, trendRes] = await Promise.all([getAnalyticsOverview(), getAllTrends()]);
      setAnalytics(analyticsRes.data || null);
      setTrends(trendRes.data || {});
    } catch (e) {
      console.error(e);
      setError('Unable to load city-wide analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const wards = analytics?.wards || [];
  const anomalies = [...wards].filter((w) => w.situationOfConcern).sort((a, b) => b.baselineDeltaPct - a.baselineDeltaPct);
  const topSpread = [...wards].sort((a, b) => b.spreadRiskScore - a.spreadRiskScore).slice(0, 8);
  const selectedWard = wards.find((w) => w.wardId === selectedWardId) || null;

  // Bar chart for anomalies
  const anomalyChartData = {
    labels: anomalies.map((w) => w.wardName),
    datasets: [
      {
        label: '% above baseline',
        data: anomalies.map((w) => w.baselineDeltaPct),
        backgroundColor: anomalies.map((w) => w.baselineDeltaPct > 100 ? '#ef4444' : '#f59e0b'),
        borderRadius: 4,
      },
    ],
  };

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
        callbacks: {
          label: (ctx) => ` +${ctx.parsed.y.toFixed(1)}% above baseline`,
        },
      },
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 30 } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 10 } }, beginAtZero: true },
    },
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Citywide Intelligence</h2>
          <p className="text-xs text-gray-400">
            Anomaly detection, spread risk and vulnerability across {wards.length} wards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {analytics && (
            <div className="text-[11px] text-gray-400 text-right">
              Baseline: <span className="font-semibold text-gray-100">{analytics.baseline.respiratoryBaseline}</span>
              <br />
              Flagged: <span className="font-semibold text-amber-300">{analytics.flaggedWards}</span>/{analytics.totalWards}
            </div>
          )}
          <button onClick={fetchData} className="app-button-ghost px-2 py-1 text-[11px]" title="Refresh">↺</button>
        </div>
      </div>

      {/* Synthetic data notice */}
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-amber-500/30 bg-amber-950/20 text-[11px] text-amber-200">
        ⚠ SYNTHETIC DEMONSTRATION DATA — analytics shown are illustrative only and not derived from real disease surveillance.
      </div>

      {/* Methodology notice */}
      {analytics?.methodology && (
        <div className="text-[10px] text-gray-500 border border-slate-800 rounded px-3 py-2">
          <strong>Methodology:</strong> {analytics.methodology}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 animate-pulse">
          Computing city-wide analytics…
        </div>
      ) : error ? (
        <div className="text-danger border border-danger/40 bg-danger/5 rounded px-3 py-2 text-xs">{error}</div>
      ) : !analytics ? (
        <div className="text-xs text-gray-500 text-center py-8">No analytics data available yet.</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-800">
            {[
              { id: 'anomalies', label: `Anomalies (${anomalies.length})` },
              { id: 'spread', label: 'Spread Risk' },
              { id: 'all', label: 'All Wards' },
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

          {/* ANOMALIES TAB */}
          {activeTab === 'anomalies' && (
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-8">
                  No wards currently exceed the 5% anomaly threshold above baseline.
                </div>
              ) : (
                <>
                  <div className="h-[180px]">
                    <Bar data={anomalyChartData} options={chartOptions} />
                  </div>
                  <div className="space-y-2">
                    {anomalies.map((w) => (
                      <div
                        key={w.wardId}
                        className={`rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                          selectedWardId === w.wardId
                            ? 'border-accentSoft/60 bg-accentSoft/5'
                            : 'border-slate-800 bg-background hover:border-slate-700'
                        }`}
                        onClick={() => setSelectedWardId(selectedWardId === w.wardId ? null : w.wardId)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-semibold text-gray-100">{w.wardName}</span>
                            {w.zone && <span className="text-[10px] text-gray-500 ml-2">{w.zone}</span>}
                          </div>
                          <span className={`text-[11px] font-bold ${w.baselineDeltaPct > 100 ? 'text-red-400' : 'text-amber-300'}`}>
                            +{w.baselineDeltaPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex gap-3 text-[11px] text-gray-400 mb-1">
                          <span>Reports: <strong className="text-gray-200">{w.respiratoryComplaints}</strong></span>
                          {w.topDisease && <span>Top: <strong className="text-gray-200 capitalize">{w.topDisease}</strong></span>}
                          <span>Risk: <strong className="text-gray-200">{w.spreadRiskScore}/30</strong></span>
                        </div>
                        {/* Explanation */}
                        {selectedWardId === w.wardId && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <div className="text-[10px] font-semibold text-gray-300 mb-1">Alert explanation</div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{w.explanation}</p>
                            <p className="text-[10px] text-amber-200/60 mt-1">
                              Human public-health verification is recommended before any action.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* SPREAD RISK TAB */}
          {activeTab === 'spread' && (
            <div className="flex flex-col gap-3 overflow-y-auto">
              <div className="text-[11px] text-gray-400">
                Spread risk combines aggregated clinic/pharmacy counts with mobility index. Higher = more likely to warrant investigation.
                <strong className="text-gray-300"> Not a validated epidemiological measure.</strong>
              </div>
              {topSpread.map((w) => (
                <div key={w.wardId} className="bg-background rounded border border-slate-800 px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium text-gray-100">{w.wardName}</span>
                      {w.zone && <span className="text-[10px] text-gray-500 ml-1.5">{w.zone}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-300 font-semibold">{w.spreadRiskScore}/30</span>
                      {w.situationOfConcern && (
                        <span className="text-[10px] text-amber-300 border border-amber-500/40 rounded px-1.5 py-0.5">Flagged</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(w.spreadRiskScore / 30) * 100}%`,
                        background: w.spreadRiskScore > 15 ? '#ef4444' : w.spreadRiskScore > 8 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span>Env risk: {w.environmentalRisk || '—'}</span>
                    <span>Vulnerability: {w.vulnerabilityIndex}/30</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ALL WARDS TAB */}
          {activeTab === 'all' && (
            <div className="overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400 text-left">
                    <th className="py-2 pr-3">Ward</th>
                    <th className="py-2 pr-3">Zone</th>
                    <th className="py-2 pr-3">Reports</th>
                    <th className="py-2 pr-3">Δ Baseline</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Top Disease</th>
                  </tr>
                </thead>
                <tbody>
                  {wards.map((w) => (
                    <tr key={w.wardId} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                      <td className="py-1.5 pr-3 font-medium text-gray-100">{w.wardName}</td>
                      <td className="py-1.5 pr-3 text-gray-400">{w.zone || '—'}</td>
                      <td className="py-1.5 pr-3 text-gray-200">{w.respiratoryComplaints}</td>
                      <td className={`py-1.5 pr-3 font-semibold ${w.baselineDeltaPct > 5 ? 'text-amber-300' : w.baselineDeltaPct < -20 ? 'text-gray-500' : 'text-gray-300'}`}>
                        {w.baselineDeltaPct > 0 ? '+' : ''}{w.baselineDeltaPct.toFixed(1)}%
                      </td>
                      <td className="py-1.5 pr-3">
                        {w.situationOfConcern ? (
                          <span className="text-amber-300 border border-amber-500/40 rounded px-1.5 py-0.5 text-[10px]">Flagged</span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Normal</span>
                        )}
                      </td>
                      <td className="py-1.5 text-gray-400 capitalize">{w.topDisease || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-gray-500 mt-2">
                Total: {analytics.totalAggregatedCases.toLocaleString()} aggregated reports across {wards.length} wards · SYNTHETIC DATA
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedAnalyticsPanel;
