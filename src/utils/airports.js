/**
 * Common US airports for quick lookup.
 * In production, you'd load the full OurAirports dataset.
 */
const AIRPORTS = [
  { icao: 'KJFK', name: 'John F. Kennedy Intl', lat: 40.6413, lon: -73.7781, elev: 13 },
  { icao: 'KLAX', name: 'Los Angeles Intl', lat: 33.9425, lon: -118.4081, elev: 128 },
  { icao: 'KORD', name: "O'Hare Intl", lat: 41.9742, lon: -87.9073, elev: 672 },
  { icao: 'KATL', name: 'Hartsfield-Jackson Atlanta Intl', lat: 33.6407, lon: -84.4277, elev: 1026 },
  { icao: 'KSFO', name: 'San Francisco Intl', lat: 37.6213, lon: -122.3790, elev: 13 },
  { icao: 'KDEN', name: 'Denver Intl', lat: 39.8561, lon: -104.6737, elev: 5431 },
  { icao: 'KPAO', name: 'Palo Alto', lat: 37.4611, lon: -122.1150, elev: 4 },
  { icao: 'KSQL', name: 'San Carlos', lat: 37.5119, lon: -122.2494, elev: 1 },
  { icao: 'KRHV', name: 'Reid-Hillview', lat: 37.3327, lon: -121.8194, elev: 135 },
  { icao: 'KLVK', name: 'Livermore Municipal', lat: 37.6934, lon: -121.8204, elev: 400 },
  { icao: 'KHAF', name: 'Half Moon Bay', lat: 37.5134, lon: -122.5011, elev: 66 },
  { icao: 'KOAK', name: 'Oakland Intl', lat: 37.7213, lon: -122.2208, elev: 9 },
  { icao: 'KSJC', name: 'San Jose Intl', lat: 37.3626, lon: -121.9291, elev: 62 },
  { icao: 'KSEA', name: 'Seattle-Tacoma Intl', lat: 47.4502, lon: -122.3088, elev: 433 },
  { icao: 'KBOS', name: 'Boston Logan Intl', lat: 42.3656, lon: -71.0096, elev: 20 },
  { icao: 'KDFW', name: 'Dallas/Fort Worth Intl', lat: 32.8998, lon: -97.0403, elev: 607 },
  { icao: 'KMIA', name: 'Miami Intl', lat: 25.7959, lon: -80.2870, elev: 8 },
  { icao: 'KPHX', name: 'Phoenix Sky Harbor Intl', lat: 33.4373, lon: -112.0078, elev: 1135 },
  { icao: 'KLAS', name: 'Las Vegas McCarran Intl', lat: 36.0840, lon: -115.1537, elev: 2181 },
  { icao: 'KMSP', name: 'Minneapolis-Saint Paul Intl', lat: 44.8848, lon: -93.2223, elev: 841 },
];

/**
 * Find nearest airport to coordinates
 */
export function findNearestAirport(lat, lon) {
  let nearest = null;
  let minDist = Infinity;

  for (const apt of AIRPORTS) {
    const dist = haversineDistance(lat, lon, apt.lat, apt.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...apt, distance: dist };
    }
  }

  return nearest;
}

/**
 * Haversine distance in nautical miles
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export { AIRPORTS };
