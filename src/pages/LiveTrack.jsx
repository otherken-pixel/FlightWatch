import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../store/useStore';
import { msToKnots, metersToFeet, headingToCompass, formatDuration } from '../utils/api';
import { useAnimatedPosition } from '../hooks/useAnimatedPosition';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function createPlaneIcon(heading = 0) {
  return L.divIcon({
    className: 'plane-marker',
    html: `<div class="plane-icon" style="transform: rotate(${heading || 0}deg); color: #007AFF;">
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

function DataRow({ icon, label, value, mono = false }) {
  if (value == null || value === '--' || value === '') return null;
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--color-separator)' }}
    >
      <div className="flex items-center gap-2">
        <MdIcon name={icon} style={{ fontSize: 16, color: 'var(--color-text-tertiary)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      </div>
      <span
        className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-separator)',
        borderRadius: 14,
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <MdIcon name={icon} style={{ fontSize: 14, color: accent ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </span>
      </div>
      <span className="text-base font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
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
  const flightHistory = useStore(s => s.flightHistory);

  const ac = aircraft.find(a => a.tailNumber === decodedTail);
  const activeTrip = activeTrips[decodedTail];
  const data = ac?.icao24 ? liveData[ac.icao24] : null;
  const trail = trails[decodedTail] || [];
  const pastTrips = flightHistory.filter(t => t.tailNumber === decodedTail);

  const trailPositions = useMemo(() => {
    return trail.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng]);
  }, [trail]);

  // Smoothly animated position via requestAnimationFrame
  const animated = useAnimatedPosition(data);
  const currentPosition = animated.position
    || (trailPositions.length > 0 ? trailPositions[trailPositions.length - 1] : null);

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  if (!ac) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div
          className="flex items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--color-accent-dim)' }}
        >
          <MdIcon name="flight_off" style={{ fontSize: 32, color: 'var(--color-accent)' }} />
        </div>
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Aircraft not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 text-sm font-semibold"
          style={{
            background: 'var(--color-accent)', color: '#fff',
            borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,122,255,0.35)',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const altitude = data?.baroAltitude ? metersToFeet(data.baroAltitude) : 0;
  const geoAlt = data?.geoAltitude ? metersToFeet(data.geoAltitude) : 0;
  const speed = data?.velocity ? msToKnots(data.velocity) : 0;
  const groundSpeed = data?.groundSpeed ?? (data?.velocity ? msToKnots(data.velocity) : 0);
  const heading = animated.heading ?? data?.heading;
  const vRate = data?.verticalRate ? Math.round(data.verticalRate * 196.85) : 0; // m/s to fpm
  const elapsed = activeTrip ? formatDuration(Date.now() - activeTrip.startedAt) : '--';
  const isAirborne = ac.status === 'airborne';
  const isStale = animated.stale;

  const chipStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 999, padding: '4px 10px',
    fontSize: 12, color: 'rgba(255,255,255,0.7)',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with sky gradient */}
      <div
        className="sky-gradient"
        style={{
          padding: '32px 24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }} className="max-w-5xl mx-auto px-0 md:px-4">
          <button
            onClick={() => navigate(`/aircraft/${encodeURIComponent(decodedTail)}`)}
            className="flex items-center gap-1 mb-5 text-sm font-medium"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <MdIcon name="arrow_back" style={{ fontSize: 18 }} />
            {ac.tailNumber}
          </button>

          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <MdIcon name="radar" style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {ac.nickname}
                </div>
                {isAirborne && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1"
                    style={{
                      background: isStale ? 'rgba(255,149,0,0.2)' : 'rgba(52,199,89,0.2)',
                      border: `1px solid ${isStale ? 'rgba(255,149,0,0.4)' : 'rgba(52,199,89,0.4)'}`,
                      borderRadius: 999,
                    }}
                  >
                    <div className="pulse-dot" style={{
                      width: 7, height: 7, borderRadius: 99,
                      background: isStale ? '#FF9500' : '#34C759',
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isStale ? '#FF9500' : '#34C759' }}>
                      {isStale ? 'STALE' : 'LIVE'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {ac.tailNumber} · {ac.aircraftType || data?.dbAircraftType || 'Aircraft'}
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {data?.callsign && (
              <div style={chipStyle}>
                <MdIcon name="label" style={{ fontSize: 12 }} />
                <span className="font-mono">{data.callsign}</span>
              </div>
            )}
            <div style={chipStyle}>
              <MdIcon name="timer" style={{ fontSize: 12 }} />
              {elapsed}
            </div>
            {data?.squawk && (
              <div style={chipStyle}>
                <MdIcon name="cell_tower" style={{ fontSize: 12 }} />
                <span className="font-mono">{data.squawk}</span>
              </div>
            )}
            <div style={chipStyle}>
              <MdIcon name="tag" style={{ fontSize: 12 }} />
              <span className="font-mono">{ac.icao24 || 'No ICAO'}</span>
            </div>
            {data?._source && (
              <div style={chipStyle}>
                <MdIcon name="cloud" style={{ fontSize: 12 }} />
                {data._source}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20 md:pb-8 mt-5">
        {/* Map card */}
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--color-separator)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 20,
          }}
        >
          <div style={{ height: 320 }}>
            <MapContainer
              center={currentPosition || [39.8, -98.5]}
              zoom={currentPosition ? 10 : 5}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer url={tileUrl} />
              {currentPosition && <MapFollower position={currentPosition} />}

              {trailPositions.length > 1 && (
                <Polyline
                  positions={trailPositions}
                  pathOptions={{ color: '#007AFF', weight: 3, opacity: 0.7 }}
                />
              )}

              {activeTrip?.departureCoords && (
                <Marker
                  position={[activeTrip.departureCoords.lat, activeTrip.departureCoords.lng]}
                  icon={createDepartureIcon()}
                />
              )}

              {currentPosition && (
                <Marker
                  position={currentPosition}
                  icon={createPlaneIcon(heading)}
                />
              )}
            </MapContainer>
          </div>
          {/* Map footer */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background: 'var(--color-card)',
              borderTop: '1px solid var(--color-separator)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <MdIcon name="location_on" style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {currentPosition
                  ? `${currentPosition[0].toFixed(4)}, ${currentPosition[1].toFixed(4)}`
                  : 'No position'}
              </span>
            </div>
            {activeTrip?.departureAirport && (
              <div className="flex items-center gap-1.5">
                <MdIcon name="flight_takeoff" style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  From {activeTrip.departureAirport}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Primary stats - 2x2 grid */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Flight Data
          </h2>
          {isAirborne && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Updated live
            </span>
          )}
        </div>

        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard icon="height" label="Baro Altitude" value={altitude ? `${altitude.toLocaleString()} ft` : '--'} />
          <StatCard icon="speed" label="Ground Speed" value={groundSpeed ? `${Math.round(groundSpeed)} kts` : '--'} />
          <StatCard icon="explore" label="Track" value={heading != null ? `${Math.round(heading)}° ${headingToCompass(heading)}` : '--'} />
          <StatCard icon="trending_up" label="Vertical Rate" value={vRate ? `${vRate > 0 ? '+' : ''}${vRate} fpm` : '--'} accent={vRate > 0} />
        </div>

        {/* Detailed flight information */}
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Details
        </h2>
        <div
          className="mb-5"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-separator)',
            borderRadius: 16,
            padding: '4px 18px',
          }}
        >
          <DataRow icon="height" label="Geometric Altitude" value={geoAlt ? `${geoAlt.toLocaleString()} ft` : null} mono />
          <DataRow icon="speed" label="Ground Speed" value={groundSpeed ? `${Math.round(groundSpeed)} kts` : null} mono />
          <DataRow icon="air" label="Indicated Airspeed" value={data?.indicatedAirspeed ? `${Math.round(data.indicatedAirspeed)} kts` : null} mono />
          <DataRow icon="air" label="True Airspeed" value={data?.trueAirspeed ? `${Math.round(data.trueAirspeed)} kts` : null} mono />
          <DataRow icon="speed" label="Mach" value={data?.mach ? `M ${data.mach.toFixed(3)}` : null} mono />
          <DataRow icon="explore" label="Track (GPS)" value={heading != null ? `${Math.round(heading)}° ${headingToCompass(heading)}` : null} mono />
          <DataRow icon="explore" label="Magnetic Heading" value={data?.magneticHeading != null ? `${Math.round(data.magneticHeading)}°` : null} mono />
          <DataRow icon="trending_up" label="Vertical Rate" value={vRate ? `${vRate > 0 ? '+' : ''}${vRate.toLocaleString()} fpm` : null} mono />
          <DataRow icon="flight" label="Selected Altitude" value={data?.navAltitude ? `${data.navAltitude.toLocaleString()} ft` : null} mono />
          <DataRow icon="navigation" label="Selected Heading" value={data?.navHeading != null ? `${Math.round(data.navHeading)}°` : null} mono />
          <DataRow icon="cell_tower" label="Squawk" value={data?.squawk || null} mono />
          <DataRow icon="label" label="Callsign" value={data?.callsign || null} mono />
          <DataRow icon="tag" label="ICAO24 Hex" value={ac.icao24 || null} mono />
          <DataRow icon="flight_class" label="Aircraft Type" value={ac.aircraftType || data?.dbAircraftType || null} />
          <DataRow icon="business" label="Operator" value={data?.operatorCode || null} />
          <DataRow icon="warning" label="Emergency" value={data?.emergencyFlag && data.emergencyFlag !== 'none' ? data.emergencyFlag : null} />
          <DataRow icon="location_on" label="Position" value={currentPosition ? `${currentPosition[0].toFixed(4)}°, ${currentPosition[1].toFixed(4)}°` : null} mono />
          <DataRow icon="cloud" label="Data Source" value={data?._source || null} />
          <DataRow icon="route" label="Trail Points" value={trailPositions.length > 0 ? `${trailPositions.length}` : null} />
          <DataRow icon="timer" label="Flight Duration" value={elapsed !== '--' ? elapsed : null} />
        </div>

        {/* Previous flights section */}
        {pastTrips.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Previous Flights
              </h2>
              <button
                onClick={() => navigate(`/aircraft/${encodeURIComponent(decodedTail)}`)}
                className="text-xs font-medium"
                style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                View All
              </button>
            </div>
            <div className="grid gap-3 mb-5">
              {pastTrips.slice(0, 3).map(trip => {
                const dep = trip.departureAirport || 'Unknown';
                const arr = trip.arrivalAirport || 'Unknown';
                const dur = trip.duration ? formatDuration(trip.duration) : '--';
                return (
                  <button
                    key={trip.id}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    className="w-full text-left"
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-separator)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {dep}
                        </span>
                        <MdIcon name="arrow_forward" style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} />
                        <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {arr}
                        </span>
                      </div>
                      <MdIcon name="chevron_right" style={{ fontSize: 18, color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span>{trip.startedAt ? new Date(trip.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                      <span>{dur}</span>
                      {trip.maxAltitude > 0 && (
                        <span>{metersToFeet(trip.maxAltitude).toLocaleString()} ft</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
