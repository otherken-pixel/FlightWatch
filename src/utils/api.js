// ADS-B data fetching utilities
// All external API calls go through Firebase Functions proxies to avoid CORS issues.

/**
 * Fetch multiple aircraft states from OpenSky (via proxy)
 */
export async function fetchOpenSkyMultiple(icao24List) {
  if (icao24List.length === 0) return [];
  const icaoParam = icao24List.join(',');
  const url = `/api/opensky?icao24=${icaoParam}`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`OpenSky network error: ${err.message}`);
  }
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error(`OpenSky proxy returned non-JSON (${ct}) — Cloud Function may not be deployed`);

  const data = await res.json();
  if (!data.states) return [];

  return data.states.map(s => ({
    icao24: s[0],
    callsign: s[1]?.trim() || '',
    registration: '',
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
    _source: 'opensky',
  }));
}

/**
 * Fetch weather at coordinates from OpenWeatherMap
 */
export async function fetchWeather(lat, lon, apiKey) {
  if (!apiKey) return null;
  const url = `/api/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
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
 */
const READSB_STALE_THRESHOLD_S = 300;

/**
 * Normalize a single readsb-format aircraft record to our shared state shape.
 * Works with adsb.lol (readsb v2 format).
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
    // Extended fields from readsb for detailed flight tracking
    groundSpeed: a.gs ?? null, // knots (raw)
    indicatedAirspeed: a.ias ?? null, // knots
    trueAirspeed: a.tas ?? null, // knots
    mach: a.mach ?? null,
    magneticHeading: a.mag_heading ?? null,
    trueHeading: a.true_heading ?? null,
    rollAngle: a.roll ?? null,
    navAltitude: a.nav_altitude_mcp ?? null, // feet (selected altitude)
    navHeading: a.nav_heading ?? null,
    navModes: a.nav_modes ?? null,
    emergencyFlag: a.emergency ?? null,
    dbAircraftType: a.t ?? null,
    operatorCode: a.ownOp ?? null,
    category: a.category ?? null,
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

// ── adsb.lol helpers ───────────────────────────────────────────────

/**
 * Returns true when the response is HTML (e.g. Firebase catch-all returning
 * index.html because the Cloud Function isn't deployed/reachable).
 */
function isJsonResponse(res) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json');
}

/**
 * Try the Firebase proxy first; if it returns HTML or errors out, fall back
 * to calling api.adsb.lol directly (it supports CORS from browsers).
 */
async function adsbLolFetch(type, ids) {
  // 1. Proxy path (works in production when Cloud Functions are deployed)
  try {
    const res = await fetch(`/api/adsblol?type=${type}&ids=${ids}`);
    if (res.ok && isJsonResponse(res)) {
      return await res.json();
    }
    console.warn(`[adsb.lol] proxy ${res.ok ? 'returned non-JSON' : `status ${res.status}`} — trying direct`);
  } catch (err) {
    console.warn(`[adsb.lol] proxy error: ${err.message} — trying direct`);
  }

  // 2. Direct fallback (adsb.lol supports CORS)
  const res = await fetch(`https://api.adsb.lol/v2/${type}/${ids}`, {
    headers: { 'User-Agent': 'FlightWatch/1.0' },
  });
  if (!res.ok) throw new Error(`adsb.lol direct returned ${res.status}`);
  return res.json();
}

export async function fetchAdsbLol(icao24) {
  try {
    const data = await adsbLolFetch('icao', icao24);
    const records = parseReadsbResponse(data, 'adsblol');
    return records.length > 0 ? records[0] : null;
  } catch (err) {
    console.warn(`[adsb.lol] fetchAdsbLol failed: ${err.message}`);
    return null;
  }
}

export async function fetchAdsbLolMultiple(icao24List) {
  if (icao24List.length === 0) return [];
  try {
    const data = await adsbLolFetch('icao', icao24List.join(','));
    return parseReadsbResponse(data, 'adsblol');
  } catch (err) {
    console.warn(`[adsb.lol] fetchAdsbLolMultiple failed: ${err.message}`);
    return [];
  }
}

export async function fetchAdsbLolByReg(registrations) {
  if (registrations.length === 0) return [];
  try {
    const data = await adsbLolFetch('reg', registrations.join(','));
    return parseReadsbResponse(data, 'adsblol');
  } catch (err) {
    console.warn(`[adsb.lol reg] fetchAdsbLolByReg failed: ${err.message}`);
    return [];
  }
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
