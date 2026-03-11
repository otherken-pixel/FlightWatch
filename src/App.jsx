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

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const setCurrentUser = useStore(s => s.setCurrentUser);
  const loadCloudData = useStore(s => s.loadCloudData);
  const theme = useStore(s => s.settings.theme) || 'system';
  const [showLogin, setShowLogin] = useState(false);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme);
    }
  }, [theme]);

  // Start polling for tracked aircraft
  usePoller();

  // Sync auth state to store and load cloud data
  useEffect(() => {
    setCurrentUser(user);
    if (user) {
      setShowLogin(false);
      migrateLocalData(user.uid)
        .then(() => loadCloudData(user.uid))
        .catch((err) => {
          console.error('[FlightWatch] Sync failed:', err);
          useStore.getState().addToast({
            type: 'error',
            title: 'Cloud Sync Error',
            message: err?.code === 'permission-denied'
              ? 'Firestore access denied. Security rules may not be deployed.'
              : 'Could not sync with cloud. Using local data.',
          });
        });
    }
  }, [user]);

  // Show loading splash while auth initializes
  if (authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 sky-gradient">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60" style={{ borderRadius: 16 }}>
          <defs>
            <linearGradient id="splash-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#001233"/>
              <stop offset="100%" stopColor="#0077B6"/>
            </linearGradient>
            <linearGradient id="splash-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#48CAE4" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#001233" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#splash-bg)"/>
          <rect width="100" height="100" rx="22" fill="url(#splash-shine)"/>
          <circle cx="50" cy="50" r="36" fill="none" stroke="#48CAE4" strokeOpacity="0.12" strokeWidth="1"/>
          <circle cx="50" cy="50" r="26" fill="none" stroke="#48CAE4" strokeOpacity="0.18" strokeWidth="1"/>
          <circle cx="50" cy="50" r="16" fill="none" stroke="#48CAE4" strokeOpacity="0.25" strokeWidth="1"/>
          <g transform="translate(50,48) rotate(-45)">
            <path d="M0-28 C2-26 4-17 4-8 L13-3 C14.5-2.2 14.5 0 13 0.8 L4 5 C4 14 2 24 0 28 C-2 24 -4 14 -4 5 L-13 0.8 C-14.5 0 -14.5-2.2 -13-3 L-4-8 C-4-17 -2-26 0-28Z" fill="white" opacity="0.95"/>
            <path d="M0 18 L3 24 L0 22 L-3 24Z" fill="white" opacity="0.8"/>
          </g>
          <circle cx="62" cy="36" r="3" fill="#48CAE4" opacity="0.9"/>
          <circle cx="62" cy="36" r="5" fill="#48CAE4" opacity="0.3"/>
        </svg>
        <div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.3px' }}>FlightWatch</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 4 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
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
