import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import Charts from './components/Charts';
import Simulator from './components/Simulator';
import AdminPanel from './components/AdminPanel';
import RoleSelection from './components/RoleSelection';
import SignalToActionTimeline from './components/SignalToActionTimeline';
import GeminiPredictionPanel from './components/GeminiPredictionPanel';
import AdvancedAnalyticsPanel from './components/AdvancedAnalyticsPanel';

const NAV_LINKS = [
  { path: '/operational', label: 'Live Map', roles: null },
  { path: '/signals', label: 'Signal Timeline', roles: null },
  { path: '/city-intel', label: 'City Intelligence', roles: null },
  { path: '/intervention', label: 'Scenario Planner', roles: null },
  { path: '/admin', label: 'Reporting Portal', roles: ['hospital', 'pharmacist', 'health_officer'] },
];

const App = () => {
  const [selectedWard, setSelectedWard] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('sentinel_user');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); }
      catch { localStorage.removeItem('sentinel_user'); }
    }
    (async () => {
      try {
        const res = await (await import('./api')).getSimulationHistory();
        if (res?.data) setSimulationHistory(res.data || []);
      } catch { /* backend unreachable — ok */ }
    })();
  }, []);

  const handleRoleSelected = (user) => {
    setCurrentUser(user);
    localStorage.setItem('sentinel_user', JSON.stringify(user));
    if (user.role === 'citizen') navigate('/operational');
    else if (user.role === 'hospital' || user.role === 'pharmacist') navigate('/admin');
    else navigate('/operational');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sentinel_user');
    navigate('/');
  };

  const handleSimulationResult = (result) => {
    setSimulationHistory((prev) => [...prev, result]);
  };

  if (!currentUser) return <RoleSelection onRoleSelected={handleRoleSelected} />;

  const hasAdminAccess = ['pharmacist', 'hospital', 'health_officer'].includes(currentUser.role);

  const visibleLinks = NAV_LINKS.filter(
    (l) => l.roles === null || l.roles.includes(currentUser.role)
  );

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      {/* Demo data banner */}
      <div className="w-full text-center text-[11px] py-1 bg-amber-900/30 border-b border-amber-500/30 text-amber-300">
        ⚠ SYNTHETIC DEMONSTRATION DATA — no real patient data · prototype role selection — not real authentication
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-background sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-accentSoft text-sm font-semibold">
              SC
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold tracking-tight leading-tight">
                <span className="text-gray-100">Sentinel City</span>{' '}
                <span className="text-gray-400 hidden sm:inline">Command Center</span>
              </h1>
              <p className="hidden md:block text-[11px] text-gray-500">
                Public health intelligence · explainable alerts · decision support
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-wrap justify-end">
            {visibleLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-2.5 py-1.5 rounded-md border text-gray-200 transition-all duration-150 hover:-translate-y-px text-[11px] ${
                  location.pathname === l.path
                    ? 'border-accentSoft bg-slate-900 text-accentSoft'
                    : 'border-slate-700 hover:border-accentSoft/60 bg-slate-900/30'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-md border border-slate-700 hover:border-red-500/40 text-[11px] text-gray-300 bg-slate-900/30 transition-all duration-150 hover:-translate-y-px"
            >
              ← Logout
            </button>
          </nav>
        </div>
      </header>

      {/* User context strip */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 px-4 md:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-gray-500">
          <span>
            Logged in as <span className="text-gray-300 font-medium">{currentUser.name}</span>
            {' · '}
            <span className="capitalize text-accentSoft">{currentUser.role?.replace('_', ' ')}</span>
          </span>
          <span>City: Chennai Metro (Demo) · Period: 2026-W39</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-4 md:py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/operational" replace />} />

          {/* Operational View: Map + Ward Dashboard + AI Panel */}
          <Route
            path="/operational"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                <div className="lg:col-span-1 app-card overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
                  <MapView selectedWard={selectedWard} onSelectWard={setSelectedWard} currentUser={currentUser} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="app-card p-4 md:p-5 overflow-hidden min-h-[260px] flex flex-col">
                    <Dashboard selectedWard={selectedWard} />
                  </div>
                  <div className="app-card p-4 md:p-5 overflow-hidden">
                    <GeminiPredictionPanel selectedWard={selectedWard} />
                  </div>
                </div>
              </div>
            }
          />

          {/* Intervention Simulator */}
          <Route
            path="/intervention"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                <div className="lg:col-span-1 app-card p-4 md:p-5 overflow-hidden">
                  <Simulator onResult={handleSimulationResult} />
                </div>
                <div className="lg:col-span-2 app-card p-4 md:p-5 overflow-hidden" style={{ minHeight: 460 }}>
                  <Charts simulationHistory={simulationHistory} />
                </div>
              </div>
            }
          />

          {/* Signal Timeline */}
          <Route
            path="/signals"
            element={
              <div className="app-card p-4 md:p-5 overflow-hidden">
                <SignalToActionTimeline />
              </div>
            }
          />

          {/* City Intelligence */}
          <Route
            path="/city-intel"
            element={
              <div className="app-card p-4 md:p-6" style={{ minHeight: 600 }}>
                <AdvancedAnalyticsPanel />
              </div>
            }
          />

          {/* Reporting Portal (hospital, pharmacist, health_officer) */}
          <Route
            path="/admin"
            element={
              hasAdminAccess ? (
                <div className="app-card p-4 md:p-6">
                  <AdminPanel user={currentUser} />
                </div>
              ) : (
                <Navigate to="/operational" replace />
              )
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-slate-800 py-3 px-6 text-center text-[10px] text-gray-600">
        Sentinel City · Public Health Intelligence Prototype · Synthetic demonstration data · Not for clinical or public-health operational use
      </footer>
    </div>
  );
};

export default App;
