// ADS-B data fetching utilities
// Calls adsb.lol and airplanes.live directly (both support CORS, no keys needed).
// OpenSky is called via Firebase Function proxy (requires CORS proxy).

/**
 * Fetch multiple aircraft states from OpenSky (via proxy)
 */
export async function fetchOpenSkyMultiple(icao24List) {
  if (icao24List.length === 0) return [];
  const icaoParam = icao24List.join(',');
  const url = `/api/opensky/states/all?icao24=${icaoParam}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`);

  const data = await res.json();
  if (!data.states) return [];

  return data.states.map(s => ({
    icao24: s[0],
    callsign: s[1]?.trim() || '',
    originCountry: s[2],
    timePosition: s[3],
    lastContact: s[4],
    longitude: s[5],
    latitude: s[6],
    baroAltitude: s[7],
    onGround: s[8],
    velocity: s[9],
    heading: s[10],
    verticalRate: s[11],
    geoAltitude: s[13],
    squawk: s[14],
    spi: s[15],
    positionSource: s[16],
  }));
}

/**
 * Fetch weather at coordinates from OpenWeatherMap
 */
export async function fetchWeather(lat, lon, apiKey) {
  if (!apiKey) return null;
  const url = `/api/weather/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Reverse geocode coordinates to nearest city
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FlightWatch/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
    const state = data.address?.state;
    return city ? `${city}${state ? ', ' + state : ''}` : data.display_name?.split(',').slice(0, 2).join(',');
  } catch {
    return null;
  }
}

/**
 * Convert m/s to knots
 */
export function msToKnots(ms) {
  return ms ? Math.round(ms * 1.94384) : 0;
}

/**
 * Convert m/s to mph
 */
export function msToMph(ms) {
  return ms ? Math.round(ms * 2.23694) : 0;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(m) {
  return m ? Math.round(m * 3.28084) : 0;
}

/**
 * Staleness threshold: position older than 5 minutes is stale.
 * GA aircraft in sparse-coverage areas often have 60-120s gaps between
 * position reports, so 60s was too aggressive and caused missed tracks.
 */
const READSB_STALE_THRESHOLD_S = 300;

/**
 * Normalize a single readsb-format aircraft record to our shared state shape.
 * Works with adsb.lol, airplanes.live, and adsb.fi (all use the same format).
 */
function normalizeReadsbRecord(a, source) {
  const seenPosSecs = a.seen_pos ?? a.seen ?? 0;
  const seenSecs = a.seen ?? 0;
  return {
    icao24: (a.hex || '').toLowerCase(),
    callsign: (a.flight || '').trim(),
    registration: (a.r || '').trim(),
    originCountry: '',
    timePosition: Math.floor(Date.now() / 1000) - seenSecs,
    lastContact: Math.floor(Date.now() / 1000) - seenSecs,
    longitude: a.lon ?? null,
    latitude: a.lat ?? null,
    baroAltitude: a.alt_baro != null && a.alt_baro !== 'ground'
      ? a.alt_baro * 0.3048   // readsb reports feet → meters
      : null,
    onGround: a.alt_baro === 'ground',
    velocity: a.gs != null ? a.gs * 0.514444 : null, // knots → m/s
    heading: a.track ?? null,
    verticalRate: a.baro_rate != null ? a.baro_rate * 0.00508 : null, // ft/min → m/s
    geoAltitude: a.alt_geom != null ? a.alt_geom * 0.3048 : null,
    squawk: a.squawk || null,
    spi: false,
    positionSource: 1,
    _source: source,
    _stale: seenPosSecs > READSB_STALE_THRESHOLD_S,
  };
}

/**
 * Parse a readsb-format response body and return normalised, non-stale records.
 */
function parseReadsbResponse(data, source) {
  if (!data?.ac) return [];
  return data.ac
    .map(a => normalizeReadsbRecord(a, source))
    .filter(r => !r._stale && r.latitude != null && r.longitude != null);
}

// ── adsb.lol (direct CORS calls) ────────────────────────────────────

export async function fetchAdsbLol(icao24) {
  const url = `https://api.adsb.lol/v2/icao/${icao24}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const records = parseReadsbResponse(await res.json(), 'adsblol');
  return records.length > 0 ? records[0] : null;
}

export async function fetchAdsbLolMultiple(icao24List) {
  if (icao24List.length === 0) return [];
  const url = `https://api.adsb.lol/v2/icao/${icao24List.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[adsb.lol] ${url} → ${res.status}`);
    return [];
  }
  return parseReadsbResponse(await res.json(), 'adsblol');
}

export async function fetchAdsbLolByReg(registrations) {
  if (registrations.length === 0) return [];
  const url = `https://api.adsb.lol/v2/reg/${registrations.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[adsb.lol reg] ${url} → ${res.status}`);
    return [];
  }
  return parseReadsbResponse(await res.json(), 'adsblol');
}

// ── airplanes.live (direct CORS calls) ──────────────────────────────

export async function fetchAirplanesLiveMultiple(icao24List) {
  if (icao24List.length === 0) return [];
  const url = `https://api.airplanes.live/v2/hex/${icao24List.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[airplanes.live] ${url} → ${res.status}`);
    return [];
  }
  return parseReadsbResponse(await res.json(), 'airplaneslive');
}

export async function fetchAirplanesLiveByReg(registrations) {
  if (registrations.length === 0) return [];
  const url = `https://api.airplanes.live/v2/reg/${registrations.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[airplanes.live reg] ${url} → ${res.status}`);
    return [];
  }
  return parseReadsbResponse(await res.json(), 'airplaneslive');
}

/**
 * Convert heading degrees to compass direction
 */
export function headingToCompass(deg) {
  if (deg == null) return '';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/**
 * Format duration from milliseconds
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format time ago
 */
export function timeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
