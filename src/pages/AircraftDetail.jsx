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
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '16px 18px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
      }}
    >
      {/* Route header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
          {departureLabel}
        </span>
        <div className="flex-1 flex items-center gap-1">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <MdIcon name="flight" style={{ fontSize: 16, color: 'var(--color-accent)', transform: 'rotate(90deg)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
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
        background: 'linear-gradient(135deg, rgba(52,199,89,0.12), rgba(10,132,255,0.12))',
        border: '1px solid rgba(52,199,89,0.3)',
        borderRadius: 20,
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

  const handleDelete = () => {
    removeAircraft(ac.id);
    addToast({ type: 'info', title: 'Removed', message: `${ac.tailNumber} removed from tracking` });
    navigate('/');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-5 pb-20 md:pb-8">
        {/* Back button + header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 mb-4 text-sm font-medium"
          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <MdIcon name="arrow_back" style={{ fontSize: 18 }} />
          My Aircraft
        </button>

        {/* Aircraft header card */}
        <div
          className="mb-6 fade-in"
          style={{
            background: 'var(--color-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22,
            padding: '22px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--color-card-mid)', fontSize: 26 }}
              >
                {ac.emoji}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
                  {ac.tailNumber}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {ac.nickname !== ac.tailNumber && <span>{ac.nickname} · </span>}
                  {ac.aircraftType || 'Aircraft'}
                </div>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)',
                cursor: 'pointer',
              }}
              title="Remove aircraft"
            >
              <MdIcon name="delete" style={{ fontSize: 18, color: '#FF3B30' }} />
            </button>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>ICAO: <span className="font-mono">{ac.icao24 || 'Not set'}</span></span>
            <span>Last seen: {ac.lastSeen ? timeAgo(ac.lastSeen) : 'Never'}</span>
            <span>{trips.length} {trips.length === 1 ? 'trip' : 'trips'}</span>
          </div>
        </div>

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
            className="text-center py-12"
            style={{
              background: 'var(--color-card)',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <MdIcon name="route" style={{ fontSize: 36, color: 'var(--color-text-tertiary)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
              No trips recorded yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Trips are automatically saved when flights are detected
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
