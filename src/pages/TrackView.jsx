import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import FlightMap from '../components/FlightMap';
import FlightDashboard from '../components/FlightDashboard';
import useStore from '../store/useStore';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

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
          <MdIcon name="search" style={{ fontSize: 48, color: 'var(--color-text-tertiary)', opacity: 0.3, marginBottom: 16 }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Aircraft Not Found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {tailNumber?.toUpperCase()} is not in your tracked list.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 18px rgba(0,122,255,0.4)',
            }}
          >
            <MdIcon name="add" style={{ fontSize: 18 }} />
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
      <aside
        className="hidden md:block w-96 overflow-y-auto"
        style={{
          background: 'var(--color-bg-elevated)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <FlightDashboard />
      </aside>
    </div>
  );
}
