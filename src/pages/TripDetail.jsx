import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../store/useStore';
import { formatDuration, msToKnots, metersToFeet, headingToCompass } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function createEndpointIcon(type) {
  const color = type === 'departure' ? '#34C759' : '#007AFF';
  const icon = type === 'departure' ? 'flight_takeoff' : 'flight_land';
  return L.divIcon({
    className: 'plane-marker',
    html: `<div style="
      width: 32px; height: 32px; border-radius: 10px;
      background: ${color}; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px ${color}60;
    ">
      <span class="material-symbols-rounded" style="font-size: 18px; color: #fff;">${icon}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function DataRow({ label, value, icon, mono = false }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
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

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const flightHistory = useStore(s => s.flightHistory);
  const settings = useStore(s => s.settings);

  const trip = flightHistory.find(t => t.id === tripId);

  const trailPositions = useMemo(() => {
    if (!trip?.trail) return [];
    return trip.trail.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng]);
  }, [trip]);

  const mapBounds = useMemo(() => {
    if (trailPositions.length === 0) return null;
    return L.latLngBounds(trailPositions).pad(0.15);
  }, [trailPositions]);

  const isDark = settings.mapStyle === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (!trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <MdIcon name="route" style={{ fontSize: 48, color: 'var(--color-text-tertiary)' }} />
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Trip not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
            borderRadius: 12, border: '1px solid rgba(0,122,255,0.3)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const departureLabel = trip.departureAirport || 'Unknown';
  const arrivalLabel = trip.arrivalAirport || 'Unknown';
  const maxAlt = trip.maxAltitude ? metersToFeet(trip.maxAltitude) : 0;
  const maxSpd = trip.maxSpeed ? msToKnots(trip.maxSpeed) : 0;
  const duration = trip.duration ? formatDuration(trip.duration) : '--';

  // Get mid-flight snapshot from trail midpoint
  const midPoint = trip.trail && trip.trail.length > 2
    ? trip.trail[Math.floor(trip.trail.length / 2)]
    : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 pb-20 md:pb-8">
        {/* Back button */}
        <button
          onClick={() => navigate(`/aircraft/${encodeURIComponent(trip.tailNumber)}`)}
          className="flex items-center gap-1 mb-4 text-sm font-medium"
          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <MdIcon name="arrow_back" style={{ fontSize: 18 }} />
          {trip.tailNumber}
        </button>

        {/* Route header */}
        <div
          className="mb-5 fade-in"
          style={{
            background: 'var(--color-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22,
            padding: '22px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{trip.emoji || '✈️'}</span>
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {trip.nickname || trip.tailNumber}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {departureLabel}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Departure
              </div>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <MdIcon name="flight" style={{ fontSize: 20, color: 'var(--color-accent)', transform: 'rotate(90deg)' }} />
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {arrivalLabel}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Arrival
              </div>
            </div>
          </div>
          <div className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            {trip.startedAt && new Date(trip.startedAt).toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        {/* Map */}
        {trailPositions.length > 1 && (
          <div
            className="mb-5 fade-in overflow-hidden"
            style={{
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              height: 320,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <MapContainer
              bounds={mapBounds}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url={tileUrl} />
              <Polyline
                positions={trailPositions}
                pathOptions={{ color: '#007AFF', weight: 3, opacity: 0.8 }}
              />
              {/* Departure marker */}
              <Marker position={trailPositions[0]} icon={createEndpointIcon('departure')} />
              {/* Arrival marker */}
              <Marker position={trailPositions[trailPositions.length - 1]} icon={createEndpointIcon('arrival')} />
            </MapContainer>
          </div>
        )}

        {/* Flight stats */}
        <div
          className="mb-5 fade-in"
          style={{
            background: 'var(--color-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '4px 18px',
          }}
        >
          <DataRow label="Duration" value={duration} icon="schedule" />
          <DataRow label="Max Altitude" value={maxAlt ? `${maxAlt.toLocaleString()} ft` : '--'} icon="height" mono />
          <DataRow label="Max Speed" value={maxSpd ? `${maxSpd} kts` : '--'} icon="speed" mono />
          <DataRow label="Trail Points" value={trip.trail?.length || 0} icon="route" />
          {trip.callsign && <DataRow label="Callsign" value={trip.callsign} icon="tag" mono />}
          {midPoint?.state && (
            <>
              {midPoint.state.heading != null && (
                <DataRow
                  label="Heading (mid-flight)"
                  value={`${Math.round(midPoint.state.heading)}° ${headingToCompass(midPoint.state.heading)}`}
                  icon="explore"
                  mono
                />
              )}
              {midPoint.state.squawk && (
                <DataRow label="Squawk (mid-flight)" value={midPoint.state.squawk} icon="cell_tower" mono />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
