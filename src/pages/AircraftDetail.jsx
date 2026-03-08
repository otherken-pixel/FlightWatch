import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { formatDuration, timeAgo, msToKnots, metersToFeet } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function TripCard({ trip, onClick }) {
  const departureLabel = trip.departureAirport || 'Unknown';
  const arrivalLabel = trip.arrivalAirport || 'Unknown';
  const duration = trip.duration ? formatDuration(trip.duration) : '--';
  const maxAlt = trip.maxAltitude ? `${metersToFeet(trip.maxAltitude).toLocaleString()} ft` : '--';
  const maxSpd = trip.maxSpeed ? `${msToKnots(trip.maxSpeed)} kts` : '--';
  const trailPoints = trip.trail?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-separator)',
        borderRadius: 16,
        padding: '16px 18px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Route header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
          {departureLabel}
        </span>
        <div className="flex-1 flex items-center gap-1">
          <div style={{ flex: 1, height: 1, background: 'var(--color-separator)' }} />
          <MdIcon name="flight" style={{ fontSize: 16, color: 'var(--color-accent)', transform: 'rotate(90deg)' }} />
          <div style={{ flex: 1, height: 1, background: 'var(--color-separator)' }} />
        </div>
        <span className="font-bold text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
          {arrivalLabel}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-2">
        <Stat icon="schedule" value={duration} />
        <Stat icon="height" value={maxAlt} />
        <Stat icon="speed" value={maxSpd} />
      </div>

      {/* Date + trail info */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {trip.startedAt ? new Date(trip.startedAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }) : 'Unknown date'}
        </span>
        {trailPoints > 1 && (
          <div className="flex items-center gap-1">
            <MdIcon name="route" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {trailPoints} pts
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function LiveTripBanner({ trip, onClick }) {
  const duration = formatDuration(Date.now() - trip.startedAt);

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(52,199,89,0.12), rgba(0,122,255,0.12))',
        border: '1px solid rgba(52,199,89,0.3)',
        borderRadius: 16,
        padding: '18px 20px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 0 24px rgba(52,199,89,0.1)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(52,199,89,0.15)',
            }}
          >
            <MdIcon name="flight_takeoff" style={{ fontSize: 22, color: '#34C759' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: 99, background: '#34C759' }} />
              <span className="text-sm font-bold" style={{ color: '#34C759' }}>
                Live Flight
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {trip.departureAirport ? `From ${trip.departureAirport}` : 'In progress'} — {duration}
            </div>
          </div>
        </div>
        <MdIcon name="chevron_right" style={{ fontSize: 24, color: 'var(--color-text-tertiary)' }} />
      </div>
    </button>
  );
}

function Stat({ icon, value }) {
  return (
    <div className="flex items-center gap-1">
      <MdIcon name={icon} style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  );
}

export default function AircraftDetail() {
  const { tailNumber } = useParams();
  const navigate = useNavigate();
  const decodedTail = decodeURIComponent(tailNumber);
  const aircraft = useStore(s => s.aircraft);
  const flightHistory = useStore(s => s.flightHistory);
  const activeTrips = useStore(s => s.activeTrips);
  const removeAircraft = useStore(s => s.removeAircraft);
  const addToast = useStore(s => s.addToast);

  const ac = aircraft.find(a => a.tailNumber === decodedTail);
  const trips = flightHistory.filter(t => t.tailNumber === decodedTail);
  const activeTrip = activeTrips[decodedTail];

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

  const handleDelete = () => {
    removeAircraft(ac.id);
    addToast({ type: 'info', title: 'Removed', message: `${ac.tailNumber} removed from tracking` });
    navigate('/');
  };

  const chipStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 999, padding: '4px 10px',
    fontSize: 12, color: 'rgba(255,255,255,0.7)',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Aircraft header with sky gradient */}
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
            onClick={() => navigate('/')}
            className="flex items-center gap-1 mb-5 text-sm font-medium"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <MdIcon name="arrow_back" style={{ fontSize: 18 }} />
            My Aircraft
          </button>

          <div className="flex items-start justify-between gap-4">
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
                <MdIcon name="flight" style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {ac.tailNumber}
                </div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {ac.nickname !== ac.tailNumber && <span>{ac.nickname} · </span>}
                  {ac.aircraftType || 'Aircraft'}
                </div>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center shrink-0"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)',
                cursor: 'pointer', marginTop: 8,
              }}
              title="Remove aircraft"
            >
              <MdIcon name="delete" style={{ fontSize: 18, color: '#FF453A' }} />
            </button>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <div style={chipStyle}>
              <MdIcon name="tag" style={{ fontSize: 12 }} />
              <span className="font-mono">{ac.icao24 || 'No ICAO'}</span>
            </div>
            <div style={chipStyle}>
              <MdIcon name="schedule" style={{ fontSize: 12 }} />
              {ac.lastSeen ? timeAgo(ac.lastSeen) : 'Never seen'}
            </div>
            <div style={chipStyle}>
              <MdIcon name="route" style={{ fontSize: 12 }} />
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20 md:pb-8 mt-5">
        {/* Live trip banner */}
        {activeTrip && (
          <LiveTripBanner
            trip={activeTrip}
            onClick={() => navigate(`/live/${encodeURIComponent(decodedTail)}`)}
          />
        )}

        {/* Trip history */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Trip History
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
          </span>
        </div>

        {trips.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              background: 'var(--color-card)',
              borderRadius: 16,
              border: '1px solid var(--color-separator)',
            }}
          >
            <div
              className="inline-flex items-center justify-center mb-3"
              style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-accent-dim)' }}
            >
              <MdIcon name="route" style={{ fontSize: 28, color: 'var(--color-accent)' }} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No trips recorded yet
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-tertiary)', maxWidth: 280, margin: '4px auto 0' }}>
              Trips are automatically saved when flights are detected
            </p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trip/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
