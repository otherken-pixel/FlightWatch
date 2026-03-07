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
      <div className="max-w-2xl mx-auto p-5 pb-20 md:pb-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
          Flight History
        </h1>

        {flightHistory.length === 0 ? (
          <div className="text-center py-12">
            <MdIcon name="history" style={{ fontSize: 48, color: 'var(--color-text-tertiary)', opacity: 0.3, marginBottom: 16 }} />
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>No Flights Recorded</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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
                    borderRadius: 18,
                    padding: '16px 18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{flight.emoji || '✈️'}</span>
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
