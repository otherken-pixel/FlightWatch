import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import Home from './pages/Home';
import AircraftDetail from './pages/AircraftDetail';
import TripDetail from './pages/TripDetail';
import LiveTrack from './pages/LiveTrack';
import Settings from './pages/Settings';
import History from './pages/History';
import LoginScreen from './components/auth/LoginScreen';
import { usePoller } from './utils/usePoller';
import { useAuth } from './hooks/useAuth';
import { migrateLocalData } from './services/firestore';
import useStore from './store/useStore';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const setCurrentUser = useStore(s => s.setCurrentUser);
  const loadCloudData = useStore(s => s.loadCloudData);
  const [showLogin, setShowLogin] = useState(false);

  // Start polling for tracked aircraft
  usePoller();

  // Sync auth state to store and load cloud data
  useEffect(() => {
    setCurrentUser(user);
    if (user) {
      setShowLogin(false);
      // Migrate local data if first login, then load cloud data
      migrateLocalData(user.uid)
        .then(() => loadCloudData(user.uid))
        .catch(console.warn);
    }
  }, [user]);

  // Show loading splash while auth initializes
  if (authLoading) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--color-bg-elevated)' }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'var(--color-accent)',
            boxShadow: '0 0 24px rgba(10,132,255,0.4)',
          }}
        >
          <MdIcon name="flight" style={{ fontSize: 30, color: '#fff' }} />
        </div>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-elevated)' }}>
      <Navbar user={user} onShowLogin={() => setShowLogin(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aircraft/:tailNumber" element={<AircraftDetail />} />
        <Route path="/trip/:tripId" element={<TripDetail />} />
        <Route path="/live/:tailNumber" element={<LiveTrack />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <ToastContainer />
      {showLogin && <LoginScreen onClose={() => setShowLogin(false)} />}
    </div>
  );
}
