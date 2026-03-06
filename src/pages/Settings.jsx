import { useState } from 'react';
import useStore from '../store/useStore';
import { requestNotificationPermission } from '../utils/notifications';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function Section({ title, icon, children }) {
  return (
    <div
      className="mb-4 fade-in"
      style={{
        background: 'var(--color-card)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '18px 20px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-accent-dim)' }}>
            <MdIcon name={icon} style={{ fontSize: 16, color: 'var(--color-accent)' }} />
          </div>
        )}
        <h3 className="fy-section-label" style={{ margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.8px' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 text-sm outline-none"
        style={{
          background: 'var(--color-card-mid)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          color: 'var(--color-text-primary)',
          fontFamily: 'inherit',
        }}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative transition-colors"
        style={{
          width: 44, height: 24, borderRadius: 99,
          background: checked ? 'var(--color-accent)' : 'var(--color-card-high)',
          boxShadow: checked ? '0 0 10px rgba(10,132,255,0.3)' : 'none',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 rounded-full bg-white transition-transform"
          style={{ width: 20, height: 20, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const aircraft = useStore(s => s.aircraft);
  const addAircraft = useStore(s => s.addAircraft);
  const removeAircraft = useStore(s => s.removeAircraft);
  const updateAircraft = useStore(s => s.updateAircraft);
  const notifications = useStore(s => s.notifications);
  const updateNotifications = useStore(s => s.updateNotifications);
  const apiKeys = useStore(s => s.apiKeys);
  const updateApiKeys = useStore(s => s.updateApiKeys);
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const addToast = useStore(s => s.addToast);

  const [newTail, setNewTail] = useState('');
  const [newIcao, setNewIcao] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newType, setNewType] = useState('');

  const handleAddAircraft = () => {
    if (!newTail.trim()) return;
    addAircraft({
      tailNumber: newTail.trim(),
      icao24: newIcao.trim(),
      nickname: newNickname.trim() || newTail.trim(),
      aircraftType: newType.trim(),
    });
    setNewTail('');
    setNewIcao('');
    setNewNickname('');
    setNewType('');
    addToast({ type: 'info', title: 'Aircraft Added', message: `Now tracking ${newTail.trim().toUpperCase()}` });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      addToast({ type: 'info', title: 'Notifications Enabled', message: 'You will receive browser notifications' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-5 pb-20 md:pb-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>Settings</h1>

        {/* Add Aircraft */}
        <Section title="Add Aircraft" icon="add_circle">
          <Input label="Tail Number *" value={newTail} onChange={setNewTail} placeholder="N12345" />
          <Input label="ICAO24 Hex Code" value={newIcao} onChange={setNewIcao} placeholder="a1b2c3 (required for tracking)" />
          <Input label="Nickname" value={newNickname} onChange={setNewNickname} placeholder="Dad's Cessna" />
          <Input label="Aircraft Type" value={newType} onChange={setNewType} placeholder="Cessna 172" />
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Find ICAO24 hex codes at{' '}
            <a href="https://opensky-network.org/aircraft-database" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}
            >
              OpenSky Aircraft Database
            </a>
          </p>
          <button
            onClick={handleAddAircraft}
            disabled={!newTail.trim()}
            className="w-full py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 18px rgba(10,132,255,0.4)',
            }}
          >
            Add Aircraft
          </button>
        </Section>

        {/* Tracked Aircraft */}
        <Section title={`Tracked Aircraft (${aircraft.length})`} icon="flight">
          {aircraft.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No aircraft tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {aircraft.map(ac => (
                <div
                  key={ac.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: 'var(--color-card-mid)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xl">{ac.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{ac.nickname}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{ac.tailNumber} · {ac.icao24 || 'No ICAO24'}</div>
                  </div>
                  <button
                    onClick={() => removeAircraft(ac.id)}
                    className="transition-colors px-2"
                    style={{ color: 'var(--color-text-tertiary)', border: 'none', background: 'none' }}
                    title="Remove aircraft"
                  >
                    <MdIcon name="delete" style={{ fontSize: 18 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon="notifications">
          <button
            onClick={handleEnableNotifications}
            className="w-full py-2.5 mb-3 text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-card-high)',
              color: 'var(--color-text-primary)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Enable Browser Notifications
          </button>
          <Toggle label="Takeoff alerts" checked={notifications.takeoff} onChange={v => updateNotifications({ takeoff: v })} />
          <Toggle label="Landing alerts" checked={notifications.landing} onChange={v => updateNotifications({ landing: v })} />
          <Toggle label="Lost signal alerts" checked={notifications.lostSignal} onChange={v => updateNotifications({ lostSignal: v })} />
          <Toggle label="Sound effects" checked={notifications.sound} onChange={v => updateNotifications({ sound: v })} />
        </Section>

        {/* API Keys */}
        <Section title="API Keys" icon="key">
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            API keys are stored locally in your browser and never sent to any server except the respective API providers.
          </p>
          <Input
            label="OpenWeatherMap API Key"
            value={apiKeys.openweather}
            onChange={v => updateApiKeys({ openweather: v })}
            placeholder="Get free key at openweathermap.org"
          />
          <Input
            label="ADS-B Exchange API Key (optional)"
            value={apiKeys.adsbExchange}
            onChange={v => updateApiKeys({ adsbExchange: v })}
            placeholder="For enhanced tracking"
          />
        </Section>

        {/* Display Settings */}
        <Section title="Display" icon="palette">
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.8px' }}>Map Style</span>
            <div className="flex gap-2 mt-2">
              {['dark', 'light'].map(style => (
                <button
                  key={style}
                  onClick={() => updateSettings({ mapStyle: style })}
                  className="flex-1 py-2.5 text-sm font-semibold capitalize transition-all"
                  style={{
                    borderRadius: 12,
                    background: settings.mapStyle === style ? 'var(--color-accent)' : 'var(--color-card-high)',
                    color: settings.mapStyle === style ? '#fff' : 'var(--color-text-secondary)',
                    border: settings.mapStyle === style ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: settings.mapStyle === style ? '0 4px 12px rgba(10,132,255,0.3)' : 'none',
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.8px' }}>Poll Interval</span>
            <div className="flex gap-2 mt-2">
              {[
                { value: 5000, label: '5s' },
                { value: 10000, label: '10s' },
                { value: 30000, label: '30s' },
                { value: 60000, label: '60s' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ pollInterval: opt.value })}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    borderRadius: 12,
                    background: settings.pollInterval === opt.value ? 'var(--color-accent)' : 'var(--color-card-high)',
                    color: settings.pollInterval === opt.value ? '#fff' : 'var(--color-text-secondary)',
                    border: settings.pollInterval === opt.value ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: settings.pollInterval === opt.value ? '0 4px 12px rgba(10,132,255,0.3)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
