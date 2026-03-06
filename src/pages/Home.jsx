import { useState } from 'react';
import FlightMap from '../components/FlightMap';
import FlightDashboard from '../components/FlightDashboard';
import AircraftList from '../components/AircraftList';
import useStore from '../store/useStore';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

export default function Home() {
  const selectedTail = useStore(s => s.selectedTail);
  const aircraft = useStore(s => s.aircraft);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-80 shrink-0"
        style={{
          background: 'var(--color-bg-elevated)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="fy-section-label" style={{ margin: 0 }}>
            Tracked Aircraft ({aircraft.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AircraftList />
        </div>
        {selectedTail && (
          <div className="max-h-[50%] overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <FlightDashboard />
          </div>
        )}
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <FlightMap />

        {/* Mobile: Aircraft count button — glassmorphism */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="md:hidden absolute top-3 left-3 z-[500] glass px-3 py-2 flex items-center gap-2 shadow-lg"
          style={{ borderRadius: 14 }}
        >
          <MdIcon name="flight" style={{ fontSize: 18, color: 'var(--color-accent)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {aircraft.length} Aircraft
          </span>
        </button>
      </div>

      {/* Mobile bottom sheet — glassmorphism */}
      {showPanel && (
        <div className="md:hidden fixed inset-0 z-[600]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div
            className="absolute bottom-14 left-0 right-0 max-h-[70vh] overflow-y-auto"
            style={{
              background: 'var(--color-bg-elevated)',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <AircraftList onSelect={() => setShowPanel(false)} />
            {selectedTail && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <FlightDashboard />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
