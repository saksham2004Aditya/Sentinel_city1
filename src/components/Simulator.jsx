import React, { useState } from 'react';
import { simulatePolicy } from '../api';

const Simulator = ({ onResult }) => {
  const [cases, setCases] = useState('');
  const [busyPolicy, setBusyPolicy] = useState('');
  const [error, setError] = useState('');

  const runSimulation = async (policy) => {
    setError('');
    const numeric = Number(cases);
    if (Number.isNaN(numeric) || numeric < 0) {
      setError('Enter a valid non-negative case estimate.');
      return;
    }
    try {
      setBusyPolicy(policy);
      const res = await simulatePolicy({ cases: numeric, policy });
      if (onResult) onResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Simulation failed. Backend may be unreachable.');
    } finally {
      setBusyPolicy('');
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            Intervention simulator
          </h2>
          <p className="text-xs text-gray-400">
            Test response packages against an estimated city-wide active case burden.
          </p>
        </div>
        <div className="text-[11px] text-gray-400 text-right hidden sm:block">
          Engine:{' '}
          <span className="text-gray-200 font-medium">PolicyLab v1</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex-1">
          <label className="block text-[11px] text-gray-400 mb-1">
            Estimated active cases (city-wide)
          </label>
          <input
            type="number"
            value={cases}
            onChange={(e) => setCases(e.target.value)}
            className="app-input rounded-md px-2 py-1.5"
            placeholder="e.g. 1200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-1">
        <button
          type="button"
          onClick={() => runSimulation('mobile_clinic')}
          disabled={!!busyPolicy}
          className="app-button-primary w-full justify-start px-3 py-2 text-left"
        >
          <div className="font-semibold text-[11px]">Deploy Mobile Clinic</div>
          <div className="text-[10px] text-gray-200/80">
            Aggressive early care in high-risk wards.
          </div>
        </button>
        <button
          type="button"
          onClick={() => runSimulation('mask_advisory')}
          disabled={!!busyPolicy}
          className="app-button-ghost w-full justify-start px-3 py-2 text-left"
        >
          <div className="font-semibold text-[11px]">Mask Advisory</div>
          <div className="text-[10px] text-gray-200/80">
            Population-wide non-pharmaceutical intervention.
          </div>
        </button>
        <button
          type="button"
          onClick={() => runSimulation('traffic_restriction')}
          disabled={!!busyPolicy}
          className="app-button-ghost w-full justify-start px-3 py-2 text-left"
        >
          <div className="font-semibold text-[11px]">
            Traffic Restriction
          </div>
          <div className="text-[10px] text-gray-200/80">
            Mobility dampening in congested corridors.
          </div>
        </button>
      </div>

      {busyPolicy && (
        <div className="text-[11px] text-gray-400 mt-1">
          Running simulation for{' '}
          <span className="font-semibold text-gray-200">
            {busyPolicy.replace('_', ' ')}
          </span>
          …
        </div>
      )}

      {error && (
        <div className="text-[11px] text-danger mt-1 border border-danger/40 bg-danger/5 rounded px-2 py-1">
          {error}
        </div>
      )}

      <p className="mt-auto text-[10px] text-gray-500">
        Each run is logged to the policy impact timeline for comparison.
      </p>
    </div>
  );
};

export default Simulator;

