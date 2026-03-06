import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import Home from './pages/Home';
import TrackView from './pages/TrackView';
import Settings from './pages/Settings';
import History from './pages/History';
import { usePoller } from './utils/usePoller';

export default function App() {
  // Start polling for tracked aircraft
  usePoller();

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-elevated)' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track/:tailNumber" element={<TrackView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}
