import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';
import { isValidNNumber, nNumberToIcao24 } from '../utils/nNumberToIcao';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

const statusColors = {
  airborne: { text: '#34C759', bg: 'rgba(52, 199, 89, 0.12)' },
  taxiing: { text: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.12)' },
  on_ground: { text: '#8E8E93', bg: 'rgba(142, 142, 147, 0.12)' },
  landed: { text: '#007AFF', bg: 'rgba(0, 122, 255, 0.10)' },
  unknown: { text: '#8E8E93', bg: 'rgba(142, 142, 147, 0.12)' },
};

const statusLabels = {
  airborne: 'In Flight',
  taxiing: 'Taxiing',
  on_ground: 'On Ground',
  landed: 'Landed',
  unknown: 'Unknown',
};

function AircraftCard({ aircraft, tripCount, activeTrip, onClick }) {
  const isLive = aircraft.status === 'airborne' || aircraft.status === 'taxiing';
  const status = statusColors[aircraft.status] || statusColors.unknown;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all"
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${isLive ? 'rgba(52,199,89,0.25)' : 'var(--color-separator)'}`,
        borderRadius: 14,
        padding: '16px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: isLive ? '0 0 20px rgba(52,199,89,0.08)' : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--color-accent-dim)',
            }}
          >
            <MdIcon name="flight" style={{ fontSize: 22, color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div className="font-semibold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
              {aircraft.tailNumber}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              {aircraft.nickname !== aircraft.tailNumber ? aircraft.nickname : aircraft.aircraftType || 'Aircraft'}
            </div>
          </div>
        </div>

        <div
          className="status-pill"
          style={{ background: status.bg, color: status.text }}
        >
          {isLive && (
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor' }} />
          )}
          <span>{statusLabels[aircraft.status] || 'Unknown'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MdIcon name="route" style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} />
          <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
          </span>
        </div>
        <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {aircraft.lastSeen ? timeAgo(aircraft.lastSeen) : 'No data yet'}
        </span>
      </div>

      {isLive && activeTrip && (
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2"
          style={{
            background: 'var(--color-accent-dim)',
            borderRadius: 10,
          }}
        >
          <MdIcon name="flight_takeoff" style={{ fontSize: 16, color: 'var(--color-go)' }} />
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-go)' }}>
            Live — tap to track
          </span>
        </div>
      )}
    </button>
  );
}

function AddAircraftModal({ onClose }) {
  const addAircraft = useStore(s => s.addAircraft);
  const addToast = useStore(s => s.addToast);
  const [tail, setTail] = useState('');
  const [nickname, setNickname] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tail.trim()) return;
    const icao = isValidNNumber(tail.trim()) ? (nNumberToIcao24(tail.trim()) || '') : '';
    addAircraft({
      tailNumber: tail.trim(),
      icao24: icao,
      nickname: nickname.trim() || tail.trim(),
      aircraftType: type.trim(),
    });
    addToast({ type: 'info', title: 'Aircraft Added', message: `Now tracking ${tail.trim().toUpperCase()}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 fade-in"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-separator)',
          borderRadius: 20,
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Add Aircraft</h2>
          <button
            onClick={onClose}
            style={{ background: 'var(--color-card-mid)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MdIcon name="close" style={{ fontSize: 16, color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <ModalField label="Tail Number *" value={tail} onChange={setTail} placeholder="N12345" />
          <ModalField label="Nickname" value={nickname} onChange={setNickname} placeholder="Dad's Cessna" />
          <ModalField label="Aircraft Type" value={type} onChange={setType} placeholder="Cessna 172" />

          <button
            type="submit"
            disabled={!tail.trim()}
            className="w-full py-3 text-[15px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'var(--color-accent)', color: '#fff', borderRadius: 12,
              border: 'none', cursor: tail.trim() ? 'pointer' : 'not-allowed',
              boxShadow: 'var(--shadow-button)', fontFamily: 'inherit', marginTop: 8,
            }}
          >
            Add Aircraft
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="modern-input" />
    </label>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const aircraft = useStore(s => s.aircraft);
  const flightHistory = useStore(s => s.flightHistory);
  const activeTrips = useStore(s => s.activeTrips);
  const [showAddModal, setShowAddModal] = useState(false);

  const getTripCount = (tailNumber) =>
    flightHistory.filter(t => t.tailNumber === tailNumber).length;

  const liveCount = aircraft.filter(a => a.status === 'airborne' || a.status === 'taxiing').length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="sky-gradient" style={{ padding: '40px 24px 36px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="fade-in" style={{
            fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: 8,
          }}>
            Always know when<br />they <span style={{ color: '#90E0EF' }}>land.</span>
          </h1>
          <p className="fade-in" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 380, margin: '0 auto 20px' }}>
            Track any aircraft worldwide with instant alerts.
          </p>
          <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            {[
              { val: aircraft.length, label: 'Aircraft', color: '#fff' },
              { val: liveCount, label: 'Live', color: liveCount > 0 ? '#34C759' : '#fff' },
              { val: flightHistory.length, label: 'Trips', color: '#fff' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-24 md:pb-8" style={{ marginTop: -14 }}>
        <div className="glass fade-in flex items-center justify-between mb-4" style={{ padding: '14px 18px' }}>
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--color-text-primary)' }}>My Aircraft</h2>
            <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{aircraft.length} aircraft tracked</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3.5 py-2 text-[15px] font-semibold"
            style={{
              background: 'var(--color-accent-dim)', color: 'var(--color-accent)', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <MdIcon name="add" style={{ fontSize: 20, color: 'var(--color-accent)' }} />
            Add
          </button>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {aircraft.map(ac => (
            <AircraftCard
              key={ac.id}
              aircraft={ac}
              tripCount={getTripCount(ac.tailNumber)}
              activeTrip={activeTrips[ac.tailNumber]}
              onClick={() => navigate(`/aircraft/${encodeURIComponent(ac.tailNumber)}`)}
            />
          ))}
        </div>

        {aircraft.length === 0 && (
          <div className="text-center mt-8 fade-in">
            <div className="inline-flex items-center justify-center mb-4" style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--color-accent-dim)' }}>
              <MdIcon name="flight" style={{ fontSize: 32, color: 'var(--color-accent)' }} />
            </div>
            <h2 className="text-[17px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>No Aircraft Yet</h2>
            <p className="text-[14px]" style={{ color: 'var(--color-text-tertiary)', maxWidth: 280, margin: '0 auto' }}>
              Add a plane by its tail number to start tracking flights.
            </p>
          </div>
        )}
      </div>

      {showAddModal && <AddAircraftModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
