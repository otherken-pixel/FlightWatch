import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';

export default function History() {
  const flightHistory = useStore(s => s.flightHistory);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-8">
        <h1 className="font-display text-2xl font-bold text-sky mb-6">Flight History</h1>

        {flightHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-display text-lg font-semibold text-sky mb-2">No Flights Recorded</h3>
            <p className="text-sm text-sky-dim">
              Flights will appear here automatically when tracked aircraft take off and land.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {flightHistory.map(flight => (
              <div
                key={flight.id}
                className="bg-navy-mid/50 rounded-xl border border-navy-light p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛬</span>
                    <span className="font-display font-semibold text-sky">{flight.nickname}</span>
                  </div>
                  <span className="text-xs text-sky-dim">{timeAgo(flight.landedAt)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-sky-dim">
                  <span className="font-display">{flight.tailNumber}</span>
                  <span>·</span>
                  <span>Near {flight.nearAirport}</span>
                  {flight.duration && (
                    <>
                      <span>·</span>
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
