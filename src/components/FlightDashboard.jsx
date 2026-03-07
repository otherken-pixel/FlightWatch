import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { metersToFeet, msToKnots, msToMph, headingToCompass, formatDuration, reverseGeocode, fetchWeather } from '../utils/api';

function MdIcon({ name, style }) {
  return <span className="material-symbols-rounded" style={style}>{name}</span>;
}

function StatusBadge({ status }) {
  const config = {
    airborne: { bg: 'rgba(52,199,89,0.15)', color: '#34C759', label: 'Airborne', glow: '0 0 10px rgba(52,199,89,0.3)' },
    taxiing: { bg: 'rgba(255,149,0,0.15)', color: '#FF9F0A', label: 'Taxiing', glow: 'none' },
    on_ground: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', label: 'On Ground', glow: 'none' },
    landed: { bg: 'rgba(52,199,89,0.15)', color: '#34C759', label: 'Landed', glow: 'none' },
    unknown: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: 'Unknown', glow: 'none' },
  };
  const c = config[status] || config.unknown;

  return (
    <span
      className="status-pill"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}`,
        boxShadow: c.glow,
      }}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'airborne' ? 'pulse-dot' : ''}`}
        style={{ background: c.color }}
      />
      {c.label}
    </span>
  );
}

function DataRow({ icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--color-card-high)',
        }}
      >
        <MdIcon name={icon} style={{ fontSize: 16, color: 'var(--color-text-secondary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="fy-section-label" style={{ marginBottom: 2, fontSize: 10 }}>{label}</div>
        <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '—'}</div>
        {sub && <div className="text-xs" style={{ color: 'var(--color-text-tertiary)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function FlightDashboard() {
  const aircraft = useStore(s => s.aircraft);
  const selectedTail = useStore(s => s.selectedTail);
  const liveData = useStore(s => s.liveData);
  const setSelectedTail = useStore(s => s.setSelectedTail);
  const apiKeys = useStore(s => s.apiKeys);
  const [nearCity, setNearCity] = useState(null);
  const [weather, setWeather] = useState(null);

  const ac = aircraft.find(a => a.tailNumber === selectedTail);
  const data = ac?.icao24 ? liveData[ac.icao24] : null;

  useEffect(() => {
    if (!data?.latitude || !data?.longitude) return;
    const timeout = setTimeout(async () => {
      const city = await reverseGeocode(data.latitude, data.longitude);
      setNearCity(city);
    }, 500);
    return () => clearTimeout(timeout);
  }, [data?.latitude?.toFixed(2), data?.longitude?.toFixed(2)]);

  useEffect(() => {
    if (!data?.latitude || !data?.longitude || !apiKeys.openweather) return;
    const timeout = setTimeout(async () => {
      const w = await fetchWeather(data.latitude, data.longitude, apiKeys.openweather);
      setWeather(w);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [data?.latitude?.toFixed(1), data?.longitude?.toFixed(1), apiKeys.openweather]);

  if (!ac) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <MdIcon name="flight" style={{ fontSize: 48, color: 'var(--color-text-tertiary)', opacity: 0.3, marginBottom: 12 }} />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>No Aircraft Selected</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Select a tracked aircraft from the list, or add one in Settings.</p>
        </div>
      </div>
    );
  }

  const altFeet = metersToFeet(data?.baroAltitude);
  const geoAltFeet = metersToFeet(data?.geoAltitude);
  const speedKnots = msToKnots(data?.velocity);
  const speedMph = msToMph(data?.velocity);
  const heading = data?.heading;
  const compass = headingToCompass(heading);

  return (
    <div className="h-full overflow-y-auto fade-in">
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ac.emoji}</span>
            <div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
                {ac.nickname}
              </h2>
              <p className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{ac.tailNumber}</p>
            </div>
          </div>
          <StatusBadge status={ac.status} />
        </div>
        {data?.callsign && data.callsign !== ac.tailNumber && (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Callsign: {data.callsign}</p>
        )}
      </div>

      {/* Data rows */}
      <div className="p-4">
        <DataRow icon="location_on" label="Position"
          value={nearCity || (data ? `${data.latitude?.toFixed(4)}°, ${data.longitude?.toFixed(4)}°` : null)}
          sub={data ? `${data.latitude?.toFixed(4)}°N, ${data.longitude?.toFixed(4)}°W` : null}
        />
        <DataRow icon="explore" label="Heading"
          value={heading != null ? `${Math.round(heading)}° · ${compass}` : null}
        />
        <DataRow icon="speed" label="Ground Speed"
          value={data?.velocity != null ? `${speedKnots} kts` : null}
          sub={data?.velocity != null ? `${speedMph} mph` : null}
        />
        <DataRow icon="altitude" label="Altitude"
          value={altFeet ? `${altFeet.toLocaleString()} ft MSL` : null}
          sub={geoAltFeet ? `Geo: ${geoAltFeet.toLocaleString()} ft` : null}
        />
        <DataRow icon="swap_vert" label="Vertical Rate"
          value={data?.verticalRate != null ? `${Math.round(data.verticalRate * 196.85)} ft/min` : null}
        />
        <DataRow icon="cell_tower" label="Squawk"
          value={data?.squawk}
        />

        {weather && (
          <>
            <div className="my-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <DataRow icon="partly_cloudy_day" label="Weather"
              value={weather.weather?.[0]?.description}
              sub={`${Math.round(weather.main?.temp)}°F · Vis: ${(weather.visibility / 1609).toFixed(1)} mi`}
            />
            <DataRow icon="air" label="Wind"
              value={weather.wind ? `${Math.round(weather.wind.speed)} mph from ${headingToCompass(weather.wind.deg)}` : null}
              sub={weather.wind?.gust ? `Gusts: ${Math.round(weather.wind.gust)} mph` : null}
            />
          </>
        )}

        {ac.fuelCapacity && ac.fuelBurn && data?.velocity && ac.status === 'airborne' && (
          <>
            <div className="my-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <DataRow icon="local_gas_station" label="Est. Range"
              value={`~${Math.round((ac.fuelCapacity / ac.fuelBurn) * speedKnots)} nm`}
              sub={`${ac.fuelCapacity} gal capacity · ${ac.fuelBurn} gph burn`}
            />
          </>
        )}
      </div>

      {/* Close button (mobile) */}
      <div className="p-4 md:hidden">
        <button
          onClick={() => setSelectedTail(null)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: 'var(--color-card-high)',
            color: 'var(--color-text-secondary)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
