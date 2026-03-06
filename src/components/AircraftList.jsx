import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function StatusDot({ status }) {
  const colors = {
    airborne: '#34C759',
    taxiing: '#FF9500',
    on_ground: 'rgba(255,255,255,0.3)',
    landed: '#34C759',
    unknown: 'rgba(255,255,255,0.2)',
  };
  const color = colors[status] || colors.unknown;
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${status === 'airborne' ? 'pulse-dot' : ''}`}
      style={{ background: color, boxShadow: status === 'airborne' ? `0 0 6px ${color}` : 'none' }}
    />
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
        <MdIcon name="flight" style={{ fontSize: 36, color: 'var(--color-text-tertiary)', opacity: 0.3, marginBottom: 8 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No aircraft tracked yet.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Add one in Settings to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
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
            className="w-full text-left p-3 transition-all duration-200 fade-in"
            style={{
              borderRadius: 14,
              background: isSelected ? 'var(--color-accent-dim)' : 'transparent',
              border: isSelected ? '1px solid rgba(10,132,255,0.3)' : '1px solid transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{ac.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {ac.nickname}
                  </span>
                  <StatusDot status={ac.status} />
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span className="font-mono font-semibold">{ac.tailNumber}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{timeAgo(ac.lastSeen)}</span>
                </div>
              </div>
              {data && ac.status === 'airborne' && (
                <div className="text-right text-xs">
                  <div className="font-mono font-bold" style={{ color: 'var(--color-go)' }}>
                    {Math.round((data.velocity || 0) * 1.94384)} kts
                  </div>
                  <div style={{ color: 'var(--color-text-tertiary)' }}>
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
