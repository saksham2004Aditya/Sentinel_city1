import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllAlerts, getEnvironmentalData } from '../api';

// Fix default marker icons for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ALERT_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  normal: '#10b981',
};

const FLOOD_COLORS = {
  high:   'rgba(59,130,246,0.55)',
  medium: 'rgba(99,179,237,0.40)',
  low:    'rgba(147,210,255,0.25)',
};

const AutoFit = ({ wards }) => {
  const map = useMap();
  useEffect(() => {
    if (!wards || wards.length === 0) return;
    const valid = wards.filter((w) => w.lat && w.lng && !isNaN(w.lat) && !isNaN(w.lng));
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map((w) => [Number(w.lat), Number(w.lng)]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [wards, map]);
  return null;
};

const MapView = ({ selectedWard, onSelectWard }) => {
  const [wards, setWards] = useState([]);
  const [envData, setEnvData] = useState({});
  const [envMeta, setEnvMeta] = useState(null);
  const [showEnvLayer, setShowEnvLayer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const allDiseasesRef = useRef(new Set());

  const fetchAll = async () => {
    setError('');
    try {
      const [alertsRes, envRes] = await Promise.all([getAllAlerts(), getEnvironmentalData()]);
      const alerts = alertsRes.data || [];

      // Build full diseases list
      const diseaseSet = new Set(['all']);
      alerts.forEach((a) => {
        Object.keys(a.diseaseData || {}).forEach((d) => diseaseSet.add(d));
      });
      allDiseasesRef.current = diseaseSet;

      setWards(alerts);
      setEnvData(envRes.data?.data || {});
      setEnvMeta(envRes.data?.metadata || null);
    } catch (e) {
      console.error(e);
      setError('Unable to load map data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredWards = diseaseFilter === 'all'
    ? wards
    : wards.filter((w) => w.diseaseData && Object.keys(w.diseaseData).includes(diseaseFilter));

  const allDiseases = Array.from(allDiseasesRef.current);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[420px]">
        <div className="text-xs text-gray-400 animate-pulse">Loading map data…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">City Health Map</h2>
          <p className="text-[11px] text-gray-400">
            {filteredWards.length} wards · click a zone for details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Disease filter */}
          <select
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="app-input rounded px-2 py-1 text-[11px] max-w-[130px]"
            aria-label="Filter by disease"
          >
            {allDiseases.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All diseases' : d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
          {/* Env layer toggle */}
          <button
            onClick={() => setShowEnvLayer((v) => !v)}
            className={`px-2 py-1 rounded text-[11px] border transition-colors ${
              showEnvLayer
                ? 'border-blue-500/60 bg-blue-900/30 text-blue-300'
                : 'border-slate-700 text-gray-400 hover:border-accentSoft'
            }`}
            title="Toggle environmental layer"
          >
            🛰 Env
          </button>
          <button
            onClick={fetchAll}
            className="app-button-ghost px-2 py-1 text-[11px]"
            title="Refresh map"
          >
            ↺
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 text-[11px] text-danger border border-danger/40 bg-danger/5 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative min-h-[380px]">
        <MapContainer
          center={[13.0827, 80.2707]}
          zoom={11}
          className="w-full h-full z-0"
          style={{ background: '#0b1a2f' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.35}
          />
          <AutoFit wards={filteredWards} />

          {/* Environmental flood-risk circles */}
          {showEnvLayer &&
            filteredWards.map((w) => {
              const env = envData[w.wardId];
              if (!env) return null;
              const fillColor = FLOOD_COLORS[env.floodRisk] || FLOOD_COLORS.low;
              const radius = env.floodRisk === 'high' ? 1400 : env.floodRisk === 'medium' ? 1000 : 700;
              return (
                <CircleMarker
                  key={`env-${w.wardId}`}
                  center={[Number(w.lat), Number(w.lng)]}
                  radius={radius / 100}
                  pathOptions={{ color: 'transparent', fillColor, fillOpacity: 0.55, weight: 0 }}
                />
              );
            })}

          {/* Ward markers */}
          {filteredWards.map((w) => {
            const level = w.alert?.level || 'normal';
            const color = ALERT_COLORS[level] || ALERT_COLORS.normal;
            const isSelected = selectedWard?.id === w.wardId;
            const env = envData[w.wardId];
            const topDiseases = Object.entries(w.diseaseData || {})
              .sort((a, b) => (b[1].clinicVisits || 0) - (a[1].clinicVisits || 0))
              .slice(0, 3);

            return (
              <CircleMarker
                key={w.wardId}
                center={[Number(w.lat), Number(w.lng)]}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  color: isSelected ? '#fff' : color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => onSelectWard({ id: w.wardId, name: w.wardName }),
                }}
              >
                <Popup className="sc-popup">
                  <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      {w.wardName}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                      Zone: {w.zone || '—'}
                    </div>
                    {/* Alert badge */}
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 700,
                        background: level === 'high' ? '#450a0a' : level === 'medium' ? '#422006' : '#052e16',
                        color: color,
                        marginBottom: 6,
                        textTransform: 'uppercase',
                      }}
                    >
                      {level === 'high' ? '⚠ High Alert' : level === 'medium' ? '▲ Elevated' : '✓ Normal'}
                    </div>
                    {/* Alert reason */}
                    {w.alert?.reason && (
                      <div style={{ fontSize: 11, color: '#d1d5db', marginBottom: 8, lineHeight: 1.5 }}>
                        {w.alert.reason}
                      </div>
                    )}
                    {/* Diseases */}
                    {topDiseases.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                          Reported diseases
                        </div>
                        {topDiseases.map(([name, d]) => (
                          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ textTransform: 'capitalize', color: '#e5e7eb' }}>{name}</span>
                            <span style={{ color: '#9ca3af' }}>{d.clinicVisits || 0} reports</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Environmental */}
                    {env && showEnvLayer && (
                      <div style={{ borderTop: '1px solid #1e293b', paddingTop: 8, marginTop: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 4 }}>
                          🛰 Env. Indicator (SYNTHETIC)
                        </div>
                        <div style={{ fontSize: 11, color: '#93c5fd' }}>
                          Flood risk: {env.floodRisk} · AQI est: {env.aqiEstimate}
                        </div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                          {env.note}
                        </div>
                      </div>
                    )}
                    {w.alert?.comparisonNote && (
                      <div style={{ fontSize: 10, color: '#6b7280', borderTop: '1px solid #1e293b', paddingTop: 6, marginTop: 6 }}>
                        {w.alert.comparisonNote}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[400] bg-background/90 border border-slate-700 rounded-lg px-3 py-2 text-[11px]">
          <div className="font-semibold text-gray-300 mb-1.5">Alert level</div>
          {Object.entries(ALERT_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2 mb-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-gray-300 capitalize">{level === 'normal' ? 'Normal' : level === 'medium' ? 'Elevated' : 'High Alert'}</span>
            </div>
          ))}
          {showEnvLayer && (
            <>
              <div className="font-semibold text-blue-300 mt-2 mb-1">Env. flood risk (SYNTHETIC)</div>
              {Object.entries(FLOOD_COLORS).map(([level, color]) => (
                <div key={level} className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="text-gray-400 capitalize">{level}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Env layer note */}
        {showEnvLayer && envMeta && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-blue-950/80 border border-blue-500/40 rounded px-3 py-1 text-[10px] text-blue-300 max-w-xs text-center">
            🛰 Environmental layer: SYNTHETIC DATA — not real satellite observations
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
