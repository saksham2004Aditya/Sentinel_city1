import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getSimulationHistory } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const POLICY_COLORS = {
  mobile_clinic:       { bar: '#5bc0be', label: 'Mobile Clinic' },
  mask_advisory:       { bar: '#60a5fa', label: 'Mask Advisory' },
  traffic_restriction: { bar: '#a78bfa', label: 'Traffic Restriction' },
  baseline:            { bar: '#6b7280', label: 'Baseline' },
};

const Charts = ({ simulationHistory: propHistory }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSimulationHistory()
      .then((res) => setHistory(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Merge prop history with stored history (prop history comes from live runs)
  const allHistory = [...history, ...(propHistory || [])].slice(-12); // max 12 runs

  if (loading) {
    return <div className="h-full flex items-center justify-center text-xs text-gray-400 animate-pulse">Loading simulation history…</div>;
  }

  if (allHistory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-8">
        <span className="text-3xl opacity-40">📊</span>
        <div className="text-xs text-gray-500">
          No simulation runs yet.<br />Use the Intervention Simulator to model policy impact.
        </div>
      </div>
    );
  }

  const labels = allHistory.map((r, i) => {
    const cfg = POLICY_COLORS[r.policy] || { label: r.policy };
    return `#${i + 1} ${cfg.label}`;
  });

  const barData = {
    labels,
    datasets: [
      {
        label: 'Original cases',
        data: allHistory.map((r) => r.originalCases),
        backgroundColor: 'rgba(107,114,128,0.5)',
        borderRadius: 3,
      },
      {
        label: 'Projected cases (after policy)',
        data: allHistory.map((r) => r.reducedCases),
        backgroundColor: allHistory.map((r) => (POLICY_COLORS[r.policy] || { bar: '#5bc0be' }).bar + 'cc'),
        borderRadius: 3,
      },
    ],
  };

  const costData = {
    labels,
    datasets: [
      {
        label: 'Estimated cost saved (USD)',
        data: allHistory.map((r) => r.costSaved),
        borderColor: '#5bc0be',
        backgroundColor: 'rgba(91,192,190,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#5bc0be',
      },
    ],
  };

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
      title: { display: true, text: title, color: '#d1d5db', font: { size: 11, weight: '600' } },
      tooltip: {
        backgroundColor: '#1c2541',
        borderColor: '#3a506b',
        borderWidth: 1,
        titleColor: '#e5e7eb',
        bodyColor: '#9ca3af',
      },
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 9 }, maxRotation: 30 } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#6b7280', font: { size: 10 } }, beginAtZero: true },
    },
  });

  // Summary stats
  const totalSaved = allHistory.reduce((s, r) => s + (r.costSaved || 0), 0);
  const avgReduction = allHistory.length
    ? (allHistory.reduce((s, r) => s + ((r.originalCases - r.reducedCases) / r.originalCases) * 100, 0) / allHistory.length).toFixed(1)
    : 0;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Policy Impact Timeline</h2>
          <p className="text-xs text-gray-400">
            Illustrative scenario comparisons across {allHistory.length} simulation run{allHistory.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="text-[10px] text-amber-300 border border-amber-500/40 bg-amber-950/20 rounded px-2 py-1">
          Scenario tool — not a validated forecast
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background rounded border border-slate-800 px-3 py-2">
          <div className="text-[10px] text-gray-500 uppercase">Simulations</div>
          <div className="text-sm font-semibold text-gray-100">{allHistory.length}</div>
        </div>
        <div className="bg-background rounded border border-slate-800 px-3 py-2">
          <div className="text-[10px] text-gray-500 uppercase">Avg case reduction</div>
          <div className="text-sm font-semibold text-accentSoft">{avgReduction}%</div>
        </div>
        <div className="bg-background rounded border border-slate-800 px-3 py-2">
          <div className="text-[10px] text-gray-500 uppercase">Est. cost saved</div>
          <div className="text-sm font-semibold text-gray-100">${totalSaved.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex-1 min-h-[180px]">
          <Bar data={barData} options={chartOptions('Cases: Original vs. Post-policy Projection')} />
        </div>
        <div className="flex-1 min-h-[160px]">
          <Line data={costData} options={chartOptions('Estimated Cost Saved per Simulation Run (USD)')} />
        </div>
      </div>

      <div className="text-[10px] text-gray-500 border-t border-slate-800 pt-2">
        Figures are illustrative estimates based on simple reduction factors ({'{mobile_clinic: 35%, mask_advisory: 25%, traffic_restriction: 20%}'}).
        They are not validated epidemiological projections. Cost saving uses a $500 per case avoided assumption for illustration only.
      </div>
    </div>
  );
};

export default Charts;
