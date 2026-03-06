import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import FlightMap from '../components/FlightMap';
import FlightDashboard from '../components/FlightDashboard';
import useStore from '../store/useStore';

export default function TrackView() {
  const { tailNumber } = useParams();
  const setSelectedTail = useStore(s => s.setSelectedTail);
  const aircraft = useStore(s => s.aircraft);

  useEffect(() => {
    if (tailNumber) {
      setSelectedTail(tailNumber.toUpperCase());
    }
  }, [tailNumber]);

  const ac = aircraft.find(a => a.tailNumber === tailNumber?.toUpperCase());

  if (!ac) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-display text-2xl font-bold text-sky mb-2">Aircraft Not Found</h2>
          <p className="text-sky-dim mb-4">
            {tailNumber?.toUpperCase()} is not in your tracked list.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-navy rounded-lg font-medium text-sm hover:bg-amber-light transition-colors"
          >
            Add Aircraft
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 relative">
        <FlightMap />
      </div>
      <aside className="hidden md:block w-96 bg-navy border-l border-navy-light overflow-y-auto">
        <FlightDashboard />
      </aside>
    </div>
  );
}
