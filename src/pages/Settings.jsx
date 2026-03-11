import { useState } from 'react';
import useStore from '../store/useStore';
import { requestNotificationPermission } from '../utils/notifications';
import { isValidNNumber, nNumberToIcao24 } from '../utils/nNumberToIcao';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function SectionHeader({ children }) {
  return <div className="section-header mt-5 mb-1.5">{children}</div>;
}

function GroupedSection({ children }) {
  return <div className="grouped-section">{children}</div>;
}

function Row({ children, style }) {
  return <div className="grouped-row" style={style}>{children}</div>;
}

function Toggle({ label, icon, checked, onChange }) {
  return (
    <Row>
      {icon && <MdIcon name={icon} style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />}
      <span className="flex-1 text-[15px]" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <button
        type="button"
        className="ios-toggle"
        data-checked={String(checked)}
        onClick={() => onChange(!checked)}
      >
        <span className="ios-toggle-knob" />
      </button>
    </Row>
  );
}

function InputRow({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <Row style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
      <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="modern-input"
        style={{ fontSize: 15 }}
      />
    </Row>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 3,
      background: 'var(--color-card-mid)',
      borderRadius: 10,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="text-[13px] font-semibold"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: value === opt.value ? 'var(--color-card)' : 'transparent',
            color: value === opt.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: value === opt.value ? 'var(--shadow-sm)' : 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const aircraft = useStore(s => s.aircraft);
  const addAircraft = useStore(s => s.addAircraft);
  const removeAircraft = useStore(s => s.removeAircraft);
  const notifications = useStore(s => s.notifications);
  const updateNotifications = useStore(s => s.updateNotifications);
  const apiKeys = useStore(s => s.apiKeys);
  const updateApiKeys = useStore(s => s.updateApiKeys);
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const addToast = useStore(s => s.addToast);

  const [newTail, setNewTail] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newType, setNewType] = useState('');

  const handleAddAircraft = () => {
    if (!newTail.trim()) return;
    const icao = isValidNNumber(newTail.trim()) ? (nNumberToIcao24(newTail.trim()) || '') : '';
    addAircraft({
      tailNumber: newTail.trim(),
      icao24: icao,
      nickname: newNickname.trim() || newTail.trim(),
      aircraftType: newType.trim(),
    });
    setNewTail(''); setNewNickname(''); setNewType('');
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
      {/* Page header */}
      <div className="sky-gradient" style={{ padding: '40px 24px 24px', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1 }} className="max-w-3xl mx-auto">
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
            Settings
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-24 md:pb-8 mt-4">
        {/* ── Add Aircraft ── */}
        <SectionHeader>Add Aircraft</SectionHeader>
        <GroupedSection>
          <InputRow label="Tail Number *" value={newTail} onChange={setNewTail} placeholder="N12345" />
          <InputRow label="Nickname" value={newNickname} onChange={setNewNickname} placeholder="Dad's Cessna" />
          <InputRow label="Aircraft Type" value={newType} onChange={setNewType} placeholder="Cessna 172" />
          <Row style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <button
              onClick={handleAddAircraft}
              disabled={!newTail.trim()}
              className="w-full py-2.5 text-[15px] font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'var(--color-accent)', color: '#fff', borderRadius: 10,
                border: 'none', cursor: newTail.trim() ? 'pointer' : 'not-allowed',
                boxShadow: 'var(--shadow-button)', fontFamily: 'inherit',
              }}
            >
              Add Aircraft
            </button>
          </Row>
        </GroupedSection>

        {/* ── Tracked Aircraft ── */}
        <SectionHeader>Tracked Aircraft ({aircraft.length})</SectionHeader>
        <GroupedSection>
          {aircraft.length === 0 ? (
            <Row>
              <span className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>No aircraft tracked yet.</span>
            </Row>
          ) : (
            aircraft.map(ac => (
              <Row key={ac.id}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-dim)' }}
                >
                  <MdIcon name="flight" style={{ fontSize: 18, color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px] truncate" style={{ color: 'var(--color-text-primary)' }}>{ac.nickname}</div>
                  <div className="text-[12px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{ac.tailNumber} · {ac.icao24 || 'No ICAO24'}</div>
                </div>
                <button
                  onClick={() => removeAircraft(ac.id)}
                  style={{ color: 'var(--color-nogo)', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <MdIcon name="delete" style={{ fontSize: 20 }} />
                </button>
              </Row>
            ))
          )}
        </GroupedSection>

        {/* ── Notifications ── */}
        <SectionHeader>Notifications</SectionHeader>
        <GroupedSection>
          <Row>
            <button
              onClick={handleEnableNotifications}
              className="w-full py-2.5 text-[14px] font-medium"
              style={{
                background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Enable Browser Notifications
            </button>
          </Row>
          <Toggle label="Takeoff alerts" icon="flight_takeoff" checked={notifications.takeoff} onChange={v => updateNotifications({ takeoff: v })} />
          <Toggle label="Landing alerts" icon="flight_land" checked={notifications.landing} onChange={v => updateNotifications({ landing: v })} />
          <Toggle label="Lost signal alerts" icon="wifi_off" checked={notifications.lostSignal} onChange={v => updateNotifications({ lostSignal: v })} />
          <Toggle label="Sound effects" icon="volume_up" checked={notifications.sound} onChange={v => updateNotifications({ sound: v })} />
        </GroupedSection>

        {/* ── API Keys ── */}
        <SectionHeader>API Keys</SectionHeader>
        <GroupedSection>
          <InputRow
            label="OpenWeatherMap API Key"
            value={apiKeys.openweather}
            onChange={v => updateApiKeys({ openweather: v })}
            placeholder="Get free key at openweathermap.org"
          />
          <InputRow
            label="ADS-B Exchange API Key (optional)"
            value={apiKeys.adsbExchange}
            onChange={v => updateApiKeys({ adsbExchange: v })}
            placeholder="RapidAPI key — better GA coverage"
          />
        </GroupedSection>
        <p className="text-[12px] mt-1.5 px-4" style={{ color: 'var(--color-text-tertiary)' }}>
          ADS-B Exchange provides better coverage for general aviation when OpenSky has gaps. Get a free key at rapidapi.com. Keys are stored locally.
        </p>

        {/* ── Display ── */}
        <SectionHeader>Display</SectionHeader>
        <GroupedSection>
          <Row style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Appearance</span>
            <SegmentedControl
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={settings.theme || 'system'}
              onChange={v => updateSettings({ theme: v })}
            />
          </Row>
          <Row style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Map Style</span>
            <SegmentedControl
              options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
              value={settings.mapStyle}
              onChange={v => updateSettings({ mapStyle: v })}
            />
          </Row>
          <Row style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Poll Interval</span>
            <SegmentedControl
              options={[
                { value: 5000, label: '5s' },
                { value: 10000, label: '10s' },
                { value: 30000, label: '30s' },
                { value: 60000, label: '60s' },
              ]}
              value={settings.pollInterval}
              onChange={v => updateSettings({ pollInterval: v })}
            />
          </Row>
        </GroupedSection>
        <p className="text-[12px] mt-1.5 px-4" style={{ color: 'var(--color-text-tertiary)' }}>
          Shorter intervals use more data but update positions faster.
        </p>
      </div>
    </div>
  );
}
