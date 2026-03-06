// ADS-B data fetching utilities

/**
 * Fetch aircraft state from OpenSky Network by ICAO24 hex code
 */
export async function fetchOpenSky(icao24, credentials = null) {
  const url = `/api/opensky/states/all?icao24=${icao24}`;
  const headers = {};
  if (credentials?.username && credentials?.password) {
    headers['Authorization'] = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`);

  const data = await res.json();
  if (!data.states || data.states.length === 0) return null;

  const s = data.states[0];
  return {
    icao24: s[0],
    callsign: s[1]?.trim() || '',
    originCountry: s[2],
    timePosition: s[3],
    lastContact: s[4],
    longitude: s[5],
    latitude: s[6],
    baroAltitude: s[7],
    onGround: s[8],
    velocity: s[9],       // m/s
    heading: s[10],        // degrees from north
    verticalRate: s[11],   // m/s
    geoAltitude: s[13],
    squawk: s[14],
    spi: s[15],
    positionSource: s[16],
  };
}

/**
 * Fetch multiple aircraft states from OpenSky
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
