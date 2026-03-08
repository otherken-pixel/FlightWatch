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
      {/* Page header */}
      <div
        className="sky-gradient"
        style={{ padding: '36px 24px 28px', position: 'relative' }}
      >
        <div style={{ position: 'relative', zIndex: 1 }} className="max-w-2xl mx-auto">
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.3px', lineHeight: 1.1, marginBottom: 4,
          }}>
            Flight History
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {flightHistory.length} {flightHistory.length === 1 ? 'flight' : 'flights'} recorded
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8" style={{ marginTop: -10 }}>
        {flightHistory.length === 0 ? (
          <div
            className="text-center py-16 fade-in"
            style={{
              background: 'var(--color-card)',
              borderRadius: 14,
              border: '1px solid var(--color-separator)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="inline-flex items-center justify-center mb-4"
              style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-accent-dim)' }}
            >
              <MdIcon name="history" style={{ fontSize: 28, color: 'var(--color-accent)' }} />
            </div>
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No Flights Recorded
            </h3>
            <p className="text-[14px]" style={{ color: 'var(--color-text-secondary)', maxWidth: 280, margin: '0 auto' }}>
              Flights will appear here automatically when tracked aircraft take off and land.
            </p>
          </div>
        ) : (
          <div className="grouped-section">
            {flightHistory.map((flight, i) => {
              const hasTrip = !!flight.trail;
              const departure = flight.departureAirport || flight.nearAirport || 'Unknown';
              const arrival = flight.arrivalAirport || flight.nearAirport || 'Unknown';
              const duration = flight.duration ? formatDuration(flight.duration) : flight.duration;
              const maxAlt = flight.maxAltitude ? `${metersToFeet(flight.maxAltitude).toLocaleString()} ft` : null;

              return (
                <button
                  key={flight.id}
                  onClick={() => hasTrip ? navigate(`/trip/${flight.id}`) : navigate(`/aircraft/${encodeURIComponent(flight.tailNumber)}`)}
                  className="w-full text-left transition-all grouped-row"
                  style={{
                    cursor: 'pointer', fontFamily: 'inherit', background: 'none', border: 'none',
                    padding: '14px 16px',
                  }}
                >
                  {/* Aircraft & time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[18px]">{flight.emoji || '✈️'}</span>
                        <span className="font-semibold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
                          {flight.nickname || flight.tailNumber}
                        </span>
                        <span className="text-[12px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                          {flight.tailNumber}
                        </span>
                      </div>
                      <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {timeAgo(flight.endedAt || flight.landedAt)}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-bold font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {departure}
                      </span>
                      <div className="flex-1 flex items-center">
                        <div style={{ flex: 1, height: 1, background: 'var(--color-separator)' }} />
                        <MdIcon name="flight" style={{ fontSize: 14, color: 'var(--color-accent)', transform: 'rotate(90deg)', margin: '0 4px' }} />
                        <div style={{ flex: 1, height: 1, background: 'var(--color-separator)' }} />
                      </div>
                      <span className="text-[13px] font-bold font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {arrival}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
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
                  </div>

                  <MdIcon name="chevron_right" style={{ fontSize: 20, color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
