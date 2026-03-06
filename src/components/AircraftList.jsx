import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';

function StatusDot({ status }) {
  const colors = {
    airborne: 'bg-green-500',
    taxiing: 'bg-yellow-500',
    on_ground: 'bg-gray-500',
    landed: 'bg-green-600',
    unknown: 'bg-gray-600',
  };
  return (
    <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.unknown} ${status === 'airborne' ? 'pulse-dot' : ''}`} />
  );
}

export default function AircraftList({ onSelect }) {
  const aircraft = useStore(s => s.aircraft);
  const selectedTail = useStore(s => s.selectedTail);
  const setSelectedTail = useStore(s => s.setSelectedTail);
  const liveData = useStore(s => s.liveData);

  if (aircraft.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-3xl mb-2">🛩️</div>
        <p className="text-sm text-sky-dim">No aircraft tracked yet.</p>
        <p className="text-xs text-sky-dim mt-1">Add one in Settings to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {aircraft.map(ac => {
        const data = liveData[ac.icao24];
        const isSelected = selectedTail === ac.tailNumber;

        return (
          <button
            key={ac.id}
            onClick={() => {
              setSelectedTail(ac.tailNumber);
              onSelect?.();
            }}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              isSelected
                ? 'bg-navy-light ring-1 ring-amber/50'
                : 'hover:bg-navy-light/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{ac.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sky truncate">
                    {ac.nickname}
                  </span>
                  <StatusDot status={ac.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-sky-dim">
                  <span className="font-display">{ac.tailNumber}</span>
                  <span>·</span>
                  <span>{timeAgo(ac.lastSeen)}</span>
                </div>
              </div>
              {data && ac.status === 'airborne' && (
                <div className="text-right text-xs">
                  <div className="text-amber font-display font-semibold">
                    {Math.round((data.velocity || 0) * 1.94384)} kts
                  </div>
                  <div className="text-sky-dim">
                    {Math.round((data.baroAltitude || 0) * 3.28084).toLocaleString()} ft
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
