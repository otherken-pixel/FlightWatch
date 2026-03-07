import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { timeAgo } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

const statusColors = {
  airborne: '#34C759',
  taxiing: '#FF9500',
  on_ground: '#8E8E93',
  landed: '#0A84FF',
  unknown: '#636366',
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
  const color = statusColors[aircraft.status] || statusColors.unknown;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all"
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${isLive ? 'rgba(52,199,89,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20,
        padding: '20px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: isLive ? '0 0 24px rgba(52,199,89,0.12)' : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header: emoji + tail */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--color-card-mid)',
              fontSize: 22,
            }}
          >
            {aircraft.emoji}
          </div>
          <div>
            <div className="font-bold text-base" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.2px' }}>
              {aircraft.tailNumber}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {aircraft.nickname !== aircraft.tailNumber ? aircraft.nickname : aircraft.aircraftType || 'Aircraft'}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1"
          style={{
            borderRadius: 99,
            background: `${color}18`,
            border: `1px solid ${color}30`,
          }}
        >
          {isLive && (
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 99, background: color }} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            {statusLabels[aircraft.status] || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Trip count + last seen */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MdIcon name="route" style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {aircraft.lastSeen ? timeAgo(aircraft.lastSeen) : 'No data yet'}
        </span>
      </div>

      {/* Live indicator bar */}
      {isLive && activeTrip && (
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2"
          style={{
            background: 'rgba(52,199,89,0.08)',
            borderRadius: 12,
            border: '1px solid rgba(52,199,89,0.15)',
          }}
        >
          <MdIcon name="flight_takeoff" style={{ fontSize: 16, color: '#34C759' }} />
          <span className="text-xs font-medium" style={{ color: '#34C759' }}>
            Live — tap to track
          </span>
        </div>
      )}
    </button>
  );
}

function AddAircraftCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-3 transition-all"
      style={{
        background: 'var(--color-card)',
        border: '2px dashed rgba(10,132,255,0.3)',
        borderRadius: 20,
        padding: '32px 20px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        minHeight: 140,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'var(--color-accent-dim)',
          border: '1px solid rgba(10,132,255,0.2)',
        }}
      >
        <MdIcon name="add" style={{ fontSize: 28, color: 'var(--color-accent)' }} />
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
          Add Aircraft
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Track a tail number
        </div>
      </div>
    </button>
  );
}

function AddAircraftModal({ onClose }) {
  const addAircraft = useStore(s => s.addAircraft);
  const addToast = useStore(s => s.addToast);
  const [tail, setTail] = useState('');
  const [icao, setIcao] = useState('');
  const [nickname, setNickname] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tail.trim()) return;
    addAircraft({
      tailNumber: tail.trim(),
      icao24: icao.trim(),
      nickname: nickname.trim() || tail.trim(),
      aircraftType: type.trim(),
    });
    addToast({ type: 'info', title: 'Aircraft Added', message: `Now tracking ${tail.trim().toUpperCase()}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 fade-in"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Add Aircraft
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'var(--color-card-mid)', border: 'none', borderRadius: 99, width: 32, height: 32, cursor: 'pointer' }}
            className="flex items-center justify-center"
          >
            <MdIcon name="close" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <InputField label="Tail Number *" value={tail} onChange={setTail} placeholder="N12345" />
          <InputField label="ICAO24 Hex Code" value={icao} onChange={setIcao} placeholder="a1b2c3 (required for live tracking)" />
          <InputField label="Nickname" value={nickname} onChange={setNickname} placeholder="Dad's Cessna" />
          <InputField label="Aircraft Type" value={type} onChange={setType} placeholder="Cessna 172" />

          <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Find ICAO24 hex codes at{' '}
            <a href="https://opensky-network.org/aircraft-database" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>
              OpenSky Aircraft Database
            </a>
          </p>

          <button
            type="submit"
            disabled={!tail.trim()}
            className="w-full py-3 text-sm font-bold transition-all disabled:opacity-40"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: 14,
              border: 'none',
              cursor: tail.trim() ? 'pointer' : 'not-allowed',
              boxShadow: '0 4px 18px rgba(10,132,255,0.4)',
              fontFamily: 'inherit',
            }}
          >
            Add Aircraft
          </button>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.8px' }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm outline-none"
        style={{
          background: 'var(--color-card)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
        }}
      />
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-5 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              My Aircraft
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {aircraft.length} {aircraft.length === 1 ? 'aircraft' : 'aircraft'} tracked
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(10,132,255,0.35)',
              fontFamily: 'inherit',
            }}
          >
            <MdIcon name="add" style={{ fontSize: 18, color: '#fff' }} />
            Add
          </button>
        </div>

        {/* Card grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {aircraft.map(ac => (
            <AircraftCard
              key={ac.id}
              aircraft={ac}
              tripCount={getTripCount(ac.tailNumber)}
              activeTrip={activeTrips[ac.tailNumber]}
              onClick={() => navigate(`/aircraft/${encodeURIComponent(ac.tailNumber)}`)}
            />
          ))}
          <AddAircraftCard onClick={() => setShowAddModal(true)} />
        </div>

        {/* Empty state */}
        {aircraft.length === 0 && (
          <div className="text-center mt-8">
            <div
              className="inline-flex items-center justify-center mb-4"
              style={{
                width: 72, height: 72, borderRadius: 22,
                background: 'var(--color-accent-dim)',
              }}
            >
              <MdIcon name="flight" style={{ fontSize: 36, color: 'var(--color-accent)' }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No Aircraft Yet
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', maxWidth: 300, margin: '0 auto' }}>
              Add a plane by its tail number to start tracking flights and building your trip history.
            </p>
          </div>
        )}
      </div>

      {showAddModal && <AddAircraftModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
