import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { metersToFeet, msToKnots, msToMph, headingToCompass, formatDuration, reverseGeocode, fetchWeather } from '../utils/api';

function StatusBadge({ status }) {
  const config = {
    airborne: { color: 'bg-green-500', label: 'Airborne', dot: 'bg-green-400' },
    taxiing: { color: 'bg-yellow-500', label: 'Taxiing', dot: 'bg-yellow-400' },
    on_ground: { color: 'bg-gray-500', label: 'On Ground', dot: 'bg-gray-400' },
    landed: { color: 'bg-green-600', label: 'Landed', dot: 'bg-green-400' },
    unknown: { color: 'bg-gray-600', label: 'Unknown', dot: 'bg-gray-500' },
  };
  const c = config[status] || config.unknown;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.color} text-white`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${status === 'airborne' ? 'pulse-dot' : ''}`} />
      {c.label}
    </span>
  );
}

function DataRow({ icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-lg w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-sky-dim uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-sky truncate">{value || '—'}</div>
        {sub && <div className="text-xs text-sky-dim">{sub}</div>}
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

  // Reverse geocode when position changes
  useEffect(() => {
    if (!data?.latitude || !data?.longitude) return;
    const timeout = setTimeout(async () => {
      const city = await reverseGeocode(data.latitude, data.longitude);
      setNearCity(city);
    }, 500);
    return () => clearTimeout(timeout);
  }, [data?.latitude?.toFixed(2), data?.longitude?.toFixed(2)]);

  // Fetch weather when position changes
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
          <div className="text-4xl mb-3">✈️</div>
          <h3 className="font-display text-lg font-semibold text-sky mb-1">No Aircraft Selected</h3>
          <p className="text-sm text-sky-dim">Select a tracked aircraft from the list, or add one in Settings.</p>
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
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-navy-light">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ac.emoji}</span>
            <div>
              <h2 className="font-display text-xl font-bold text-amber leading-tight">
                {ac.nickname}
              </h2>
              <p className="font-display text-sm text-sky-dim">{ac.tailNumber}</p>
            </div>
          </div>
          <StatusBadge status={ac.status} />
        </div>
        {data?.callsign && data.callsign !== ac.tailNumber && (
          <p className="text-xs text-sky-dim">Callsign: {data.callsign}</p>
        )}
      </div>

      {/* Data rows */}
      <div className="p-4 space-y-0.5">
        <DataRow
          icon="📍"
          label="Position"
          value={nearCity || (data ? `${data.latitude?.toFixed(4)}°, ${data.longitude?.toFixed(4)}°` : null)}
          sub={data ? `${data.latitude?.toFixed(4)}°N, ${data.longitude?.toFixed(4)}°W` : null}
        />
        <DataRow
          icon="🧭"
          label="Heading"
          value={heading != null ? `${Math.round(heading)}° · ${compass}` : null}
        />
        <DataRow
          icon="🚀"
          label="Ground Speed"
          value={data?.velocity != null ? `${speedKnots} kts` : null}
          sub={data?.velocity != null ? `${speedMph} mph` : null}
        />
        <DataRow
          icon="📐"
          label="Altitude"
          value={altFeet ? `${altFeet.toLocaleString()} ft MSL` : null}
          sub={geoAltFeet ? `Geo: ${geoAltFeet.toLocaleString()} ft` : null}
        />
        <DataRow
          icon="↕️"
          label="Vertical Rate"
          value={data?.verticalRate != null ? `${Math.round(data.verticalRate * 196.85)} ft/min` : null}
        />
        <DataRow
          icon="📶"
          label="Squawk"
          value={data?.squawk}
        />

        {weather && (
          <>
            <div className="border-t border-navy-light my-2" />
            <DataRow
              icon="🌤️"
              label="Weather"
              value={weather.weather?.[0]?.description}
              sub={`${Math.round(weather.main?.temp)}°F · Vis: ${(weather.visibility / 1609).toFixed(1)} mi`}
            />
            <DataRow
              icon="🌬️"
              label="Wind"
              value={weather.wind ? `${Math.round(weather.wind.speed)} mph from ${headingToCompass(weather.wind.deg)}` : null}
              sub={weather.wind?.gust ? `Gusts: ${Math.round(weather.wind.gust)} mph` : null}
            />
          </>
        )}

        {ac.fuelCapacity && ac.fuelBurn && data?.velocity && ac.status === 'airborne' && (
          <>
            <div className="border-t border-navy-light my-2" />
            <DataRow
              icon="⛽"
              label="Est. Range"
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
          className="w-full py-2 rounded-lg bg-navy-light text-sky-dim text-sm hover:bg-navy-mid transition-colors"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
