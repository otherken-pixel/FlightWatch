import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { timeAgo, formatDuration, msToKnots, metersToFeet } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

export default function History() {
  const navigate = useNavigate();
  const flightHistory = useStore(s => s.flightHistory);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header with sky gradient */}
      <div
        className="sky-gradient"
        style={{
          padding: '40px 24px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }} className="max-w-2xl mx-auto">
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <MdIcon name="history" style={{ fontSize: 13, color: '#90E0EF' }} />
            Flight Log
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 4,
          }}>
            Flight History
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {flightHistory.length} {flightHistory.length === 1 ? 'flight' : 'flights'} recorded
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20 md:pb-8" style={{ marginTop: -12 }}>
        {flightHistory.length === 0 ? (
          <div
            className="text-center py-16 fade-in"
            style={{
              background: 'var(--color-card)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="inline-flex items-center justify-center mb-4"
              style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--color-accent-dim)' }}
            >
              <MdIcon name="history" style={{ fontSize: 32, color: 'var(--color-accent)' }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>No Flights Recorded</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', maxWidth: 280, margin: '0 auto' }}>
              Flights will appear here automatically when tracked aircraft take off and land.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flightHistory.map(flight => {
              const hasTrip = !!flight.trail;
              const departure = flight.departureAirport || flight.nearAirport || 'Unknown';
              const arrival = flight.arrivalAirport || flight.nearAirport || 'Unknown';
              const duration = flight.duration ? formatDuration(flight.duration) : flight.duration;
              const maxAlt = flight.maxAltitude ? `${metersToFeet(flight.maxAltitude).toLocaleString()} ft` : null;

              return (
                <button
                  key={flight.id}
                  onClick={() => hasTrip ? navigate(`/trip/${flight.id}`) : navigate(`/aircraft/${encodeURIComponent(flight.tailNumber)}`)}
                  className="w-full text-left fade-in transition-all"
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '16px 18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{flight.emoji || '\u2708\uFE0F'}</span>
                      <div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {flight.nickname || flight.tailNumber}
                        </span>
                        <span className="text-xs font-mono ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                          {flight.tailNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {timeAgo(flight.endedAt || flight.landedAt)}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      {departure}
                    </span>
                    <div className="flex-1 flex items-center">
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                      <MdIcon name="flight" style={{ fontSize: 14, color: 'var(--color-accent)', transform: 'rotate(90deg)', margin: '0 4px' }} />
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      {arrival}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {duration && (
                      <div className="flex items-center gap-1">
                        <MdIcon name="schedule" style={{ fontSize: 12 }} />
                        <span>{duration}</span>
                      </div>
                    )}
                    {maxAlt && (
                      <div className="flex items-center gap-1">
                        <MdIcon name="height" style={{ fontSize: 12 }} />
                        <span>{maxAlt}</span>
                      </div>
                    )}
                    {hasTrip && (
                      <div className="flex items-center gap-1 ml-auto">
                        <MdIcon name="map" style={{ fontSize: 12, color: 'var(--color-accent)' }} />
                        <span style={{ color: 'var(--color-accent)' }}>View trip</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
