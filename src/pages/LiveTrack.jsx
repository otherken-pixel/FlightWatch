import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../store/useStore';
import { msToKnots, metersToFeet, headingToCompass, formatDuration } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function createPlaneIcon(heading = 0) {
  return L.divIcon({
    className: 'plane-marker',
    html: `<div class="plane-icon" style="transform: rotate(${heading || 0}deg); color: #0A84FF;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createDepartureIcon() {
  return L.divIcon({
    className: 'plane-marker',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 8px;
      background: #34C759; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(52,199,89,0.5);
    ">
      <span class="material-symbols-rounded" style="font-size: 16px; color: #fff;">flight_takeoff</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

// Auto-follow the aircraft
function MapFollower({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom() < 8 ? 10 : map.getZoom(), { duration: 1 });
    }
  }, [position?.[0], position?.[1]]);
  return null;
}

function StatChip({ icon, label, value }) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2"
      style={{
        background: 'var(--color-card)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        minWidth: 80,
      }}
    >
      <div className="flex items-center gap-1 mb-1">
        <MdIcon name={icon} style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }} />
        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </span>
      </div>
      <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export default function LiveTrack() {
  const { tailNumber } = useParams();
  const navigate = useNavigate();
  const decodedTail = decodeURIComponent(tailNumber);
  const aircraft = useStore(s => s.aircraft);
  const liveData = useStore(s => s.liveData);
  const activeTrips = useStore(s => s.activeTrips);
  const trails = useStore(s => s.trails);
  const settings = useStore(s => s.settings);

  const ac = aircraft.find(a => a.tailNumber === decodedTail);
  const activeTrip = activeTrips[decodedTail];
  const data = ac?.icao24 ? liveData[ac.icao24] : null;
  const trail = trails[decodedTail] || [];

  const trailPositions = useMemo(() => {
    return trail.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng]);
  }, [trail]);

  const currentPosition = useMemo(() => {
    if (data?.latitude && data?.longitude) return [data.latitude, data.longitude];
    if (trailPositions.length > 0) return trailPositions[trailPositions.length - 1];
    return null;
  }, [data, trailPositions]);

  const isDark = settings.mapStyle === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (!ac) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <MdIcon name="flight_off" style={{ fontSize: 48, color: 'var(--color-text-tertiary)' }} />
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Aircraft not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
            borderRadius: 12, border: '1px solid rgba(10,132,255,0.3)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const altitude = data?.baroAltitude ? metersToFeet(data.baroAltitude) : 0;
  const speed = data?.velocity ? msToKnots(data.velocity) : 0;
  const heading = data?.heading;
  const vRate = data?.verticalRate ? Math.round(data.verticalRate * 196.85) : 0; // m/s to fpm
  const elapsed = activeTrip ? formatDuration(Date.now() - activeTrip.startedAt) : '--';
  const isAirborne = ac.status === 'airborne';

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Back button overlay */}
      <div className="absolute top-3 left-3 z-[500] flex items-center gap-2">
        <button
          onClick={() => navigate(`/aircraft/${encodeURIComponent(decodedTail)}`)}
          className="glass flex items-center gap-2 px-3 py-2"
          style={{ borderRadius: 14, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
        >
          <MdIcon name="arrow_back" style={{ fontSize: 18, color: 'var(--color-text-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {ac.tailNumber}
          </span>
        </button>

        {isAirborne && (
          <div
            className="glass flex items-center gap-2 px-3 py-2"
            style={{ borderRadius: 14 }}
          >
            <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: 99, background: '#34C759' }} />
            <span className="text-xs font-bold" style={{ color: '#34C759' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={currentPosition || [39.8, -98.5]}
          zoom={currentPosition ? 10 : 5}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer url={tileUrl} />
          {currentPosition && <MapFollower position={currentPosition} />}

          {/* Trail */}
          {trailPositions.length > 1 && (
            <Polyline
              positions={trailPositions}
              pathOptions={{ color: '#0A84FF', weight: 3, opacity: 0.7 }}
            />
          )}

          {/* Departure marker */}
          {activeTrip?.departureCoords && (
            <Marker
              position={[activeTrip.departureCoords.lat, activeTrip.departureCoords.lng]}
              icon={createDepartureIcon()}
            />
          )}

          {/* Current position marker */}
          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={createPlaneIcon(heading)}
            />
          )}
        </MapContainer>
      </div>

      {/* Bottom data strip */}
      <div
        className="shrink-0 px-4 py-3 overflow-x-auto"
        style={{
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Info row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{ac.emoji}</span>
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {ac.nickname}
          </span>
          {data?.callsign && (
            <span className="text-xs font-mono px-2 py-0.5" style={{
              background: 'var(--color-card-mid)', borderRadius: 6, color: 'var(--color-text-secondary)',
            }}>
              {data.callsign}
            </span>
          )}
          <div className="flex-1" />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {elapsed}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <StatChip icon="height" label="Alt" value={altitude ? `${altitude.toLocaleString()} ft` : '--'} />
          <StatChip icon="speed" label="Speed" value={speed ? `${speed} kts` : '--'} />
          <StatChip icon="explore" label="Hdg" value={heading != null ? `${Math.round(heading)}° ${headingToCompass(heading)}` : '--'} />
          <StatChip icon="trending_up" label="V/S" value={vRate ? `${vRate > 0 ? '+' : ''}${vRate} fpm` : '--'} />
          {data?.squawk && <StatChip icon="cell_tower" label="Squawk" value={data.squawk} />}
        </div>
      </div>
    </div>
  );
}
