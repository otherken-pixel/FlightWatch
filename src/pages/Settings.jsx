import { useState } from 'react';
import useStore from '../store/useStore';
import { requestNotificationPermission } from '../utils/notifications';

function Section({ title, children }) {
  return (
    <div className="bg-navy-mid/50 rounded-xl border border-navy-light p-4 mb-4">
      <h3 className="font-display text-sm font-semibold text-amber uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block mb-3">
      <span className="text-xs text-sky-dim uppercase tracking-wider">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-sm text-sky placeholder-sky-dim/50 focus:outline-none focus:ring-1 focus:ring-amber/50 focus:border-amber/50"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-sky">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-amber' : 'bg-navy-light'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
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
  const [editingId, setEditingId] = useState(null);

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
      <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-8">
        <h1 className="font-display text-2xl font-bold text-sky mb-6">Settings</h1>

        {/* Add Aircraft */}
        <Section title="Add Aircraft">
          <Input label="Tail Number *" value={newTail} onChange={setNewTail} placeholder="N12345" />
          <Input label="ICAO24 Hex Code" value={newIcao} onChange={setNewIcao} placeholder="a1b2c3 (required for tracking)" />
          <Input label="Nickname" value={newNickname} onChange={setNewNickname} placeholder="Dad's Cessna" />
          <Input label="Aircraft Type" value={newType} onChange={setNewType} placeholder="Cessna 172" />
          <p className="text-xs text-sky-dim mb-3">
            Find ICAO24 hex codes at{' '}
            <a href="https://opensky-network.org/aircraft-database" target="_blank" rel="noopener" className="text-amber hover:underline">
              OpenSky Aircraft Database
            </a>
          </p>
          <button
            onClick={handleAddAircraft}
            disabled={!newTail.trim()}
            className="w-full py-2.5 bg-amber text-navy rounded-lg font-display font-semibold text-sm hover:bg-amber-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Aircraft
          </button>
        </Section>

        {/* Tracked Aircraft */}
        <Section title={`Tracked Aircraft (${aircraft.length})`}>
          {aircraft.length === 0 ? (
            <p className="text-sm text-sky-dim">No aircraft tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {aircraft.map(ac => (
                <div key={ac.id} className="flex items-center gap-3 p-3 bg-navy rounded-lg border border-navy-light">
                  <span className="text-xl">{ac.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sky text-sm truncate">{ac.nickname}</div>
                    <div className="text-xs text-sky-dim">{ac.tailNumber} · {ac.icao24 || 'No ICAO24'}</div>
                  </div>
                  <button
                    onClick={() => removeAircraft(ac.id)}
                    className="text-sky-dim hover:text-danger text-lg px-2 transition-colors"
                    title="Remove aircraft"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <button
            onClick={handleEnableNotifications}
            className="w-full py-2 mb-3 bg-navy-light text-sky rounded-lg text-sm hover:bg-navy-light/80 transition-colors"
          >
            Enable Browser Notifications
          </button>
          <Toggle label="Takeoff alerts" checked={notifications.takeoff} onChange={v => updateNotifications({ takeoff: v })} />
          <Toggle label="Landing alerts" checked={notifications.landing} onChange={v => updateNotifications({ landing: v })} />
          <Toggle label="Lost signal alerts" checked={notifications.lostSignal} onChange={v => updateNotifications({ lostSignal: v })} />
          <Toggle label="Sound effects" checked={notifications.sound} onChange={v => updateNotifications({ sound: v })} />
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          <p className="text-xs text-sky-dim mb-3">
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
        <Section title="Display">
          <div className="mb-3">
            <span className="text-xs text-sky-dim uppercase tracking-wider">Map Style</span>
            <div className="flex gap-2 mt-1">
              {['dark', 'light'].map(style => (
                <button
                  key={style}
                  onClick={() => updateSettings({ mapStyle: style })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    settings.mapStyle === style
                      ? 'bg-amber text-navy'
                      : 'bg-navy-light text-sky-dim hover:text-sky'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-sky-dim uppercase tracking-wider">Poll Interval</span>
            <div className="flex gap-2 mt-1">
              {[
                { value: 5000, label: '5s' },
                { value: 10000, label: '10s' },
                { value: 30000, label: '30s' },
                { value: 60000, label: '60s' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ pollInterval: opt.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.pollInterval === opt.value
                      ? 'bg-amber text-navy'
                      : 'bg-navy-light text-sky-dim hover:text-sky'
                  }`}
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
