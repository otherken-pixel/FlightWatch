import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

export default function History() {
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
          <div className="space-y-2">
            {flightHistory.map(flight => (
              <div
                key={flight.id}
                className="fade-in"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(52,199,89,0.15)',
                      }}
                    >
                      <MdIcon name="flight_land" style={{ fontSize: 16, color: '#34C759' }} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{flight.nickname}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{timeAgo(flight.landedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span className="font-mono font-semibold">{flight.tailNumber}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>Near {flight.nearAirport}</span>
                  {flight.duration && (
                    <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{flight.duration}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
