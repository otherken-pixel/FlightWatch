import { useState } from 'react';
import FlightMap from '../components/FlightMap';
import FlightDashboard from '../components/FlightDashboard';
import AircraftList from '../components/AircraftList';
import useStore from '../store/useStore';

export default function Home() {
  const selectedTail = useStore(s => s.selectedTail);
  const aircraft = useStore(s => s.aircraft);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-navy border-r border-navy-light shrink-0">
        <div className="p-3 border-b border-navy-light">
          <h2 className="font-display text-sm font-semibold text-sky-dim uppercase tracking-wider">
            Tracked Aircraft ({aircraft.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AircraftList />
        </div>
        {selectedTail && (
          <div className="border-t border-navy-light max-h-[50%] overflow-hidden">
            <FlightDashboard />
          </div>
        )}
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <FlightMap />

        {/* Mobile: Aircraft count button */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="md:hidden absolute top-3 left-3 z-[500] bg-navy/90 backdrop-blur-sm border border-navy-light rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg"
        >
          <span className="text-lg">✈️</span>
          <span className="font-display font-semibold text-sm text-sky">
            {aircraft.length} Aircraft
          </span>
        </button>
      </div>

      {/* Mobile bottom sheet */}
      {showPanel && (
        <div className="md:hidden fixed inset-0 z-[600]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPanel(false)} />
          <div className="absolute bottom-14 left-0 right-0 max-h-[70vh] bg-navy rounded-t-2xl border-t border-navy-light overflow-y-auto">
            <div className="w-10 h-1 bg-navy-light rounded-full mx-auto mt-3 mb-1" />
            <AircraftList onSelect={() => setShowPanel(false)} />
            {selectedTail && (
              <div className="border-t border-navy-light">
                <FlightDashboard />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
