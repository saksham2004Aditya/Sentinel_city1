import React, { useState } from 'react';
import { createOrGetUser } from '../api';

const ROLES = [
  {
    id: 'health_officer',
    label: 'Public Health Officer',
    icon: '🏛',
    description: 'City-wide intelligence, anomaly alerts, trend analysis and response planning.',
    access: ['Operational View', 'City Intelligence', 'Signal Timeline', 'Hospital Reports'],
    color: 'border-accentSoft/60 hover:border-accentSoft bg-accentSoft/5',
    badge: 'Full Access',
    badgeColor: 'text-accentSoft border-accentSoft/50',
  },
  {
    id: 'hospital',
    label: 'Hospital / Health Facility',
    icon: '🏥',
    description: 'Submit aggregated disease case counts by ward and reporting period.',
    access: ['Hospital Reporting Portal', 'Report History', 'Ward Signals Update'],
    color: 'border-blue-500/40 hover:border-blue-400 bg-blue-900/10',
    badge: 'Reporting',
    badgeColor: 'text-blue-400 border-blue-500/40',
  },
  {
    id: 'pharmacist',
    label: 'Pharmacist',
    icon: '💊',
    description: 'Update pharmacy sales data to support city-wide disease tracking.',
    access: ['Pharmacy Data Entry', 'Ward Signals Update'],
    color: 'border-purple-500/40 hover:border-purple-400 bg-purple-900/10',
    badge: 'Data Entry',
    badgeColor: 'text-purple-400 border-purple-500/40',
  },
  {
    id: 'citizen',
    label: 'Citizen / Community Member',
    icon: '👤',
    description: 'View the public health map and alerts for your area.',
    access: ['Operational Map View', 'Alert Information'],
    color: 'border-slate-600 hover:border-slate-400 bg-slate-900/20',
    badge: 'Read-only',
    badgeColor: 'text-gray-400 border-slate-600',
  },
];

const RoleSelection = ({ onRoleSelected }) => {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected) { setError('Please select a role.'); return; }
    if (!name.trim()) { setError('Please enter your name or facility name.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createOrGetUser(selected, name.trim());
      onRoleSelected(res.data);
    } catch (e) {
      setError('Unable to connect to backend. Please ensure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-slate-800 bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-accentSoft text-sm font-bold">
            SC
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100">Sentinel City</h1>
            <p className="text-[11px] text-gray-500">Public Health Intelligence Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-1 rounded border border-amber-500/40 bg-amber-900/20 text-amber-300">
            ⚠ DEMO MODE — Synthetic Data
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Title block */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accentSoft/30 bg-accentSoft/5 text-[11px] text-accentSoft mb-4">
              🛰 AI-Powered Public Health Early-Warning System
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2 tracking-tight">
              Welcome to Sentinel City
            </h1>
            <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
              An integrated platform combining aggregated facility reports, geospatial analysis
              and explainable analytics to support public-health decision-making.
            </p>
            <div className="mt-3 text-[11px] text-gray-500">
              Note: This is a prototype using{' '}
              <strong className="text-amber-300">synthetic demonstration data</strong> only.
              Role selection is for demonstration — not real secure authentication.
            </div>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${role.color} ${
                  selected === role.id ? 'ring-2 ring-accentSoft/50 scale-[1.01]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{role.icon}</span>
                    <span className="text-sm font-semibold text-gray-100">{role.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${role.badgeColor}`}>
                    {role.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.access.map((a) => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-gray-400">
                      {a}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Name input + continue */}
          <div className="bg-card border border-slate-800 rounded-xl p-4">
            <div className="mb-3">
              <label className="block text-[11px] text-gray-400 mb-1.5">
                Your name or facility name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                className="app-input rounded-lg"
                placeholder="e.g. Dr. Priya Sharma · Central Hospital"
              />
            </div>

            {error && (
              <div className="text-[11px] text-danger mb-3">{error}</div>
            )}

            <button
              onClick={handleContinue}
              disabled={loading || !selected || !name.trim()}
              className="app-button-primary w-full py-2.5 text-sm"
            >
              {loading ? 'Connecting…' : selected ? `Continue as ${ROLES.find(r => r.id === selected)?.label}` : 'Select a role to continue'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-6 py-3 text-center text-[10px] text-gray-600">
        Sentinel City · Public Health Intelligence Prototype · Demo data is synthetic and does not represent real patients or disease events.
      </div>
    </div>
  );
};

export default RoleSelection;
