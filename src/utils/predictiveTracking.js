/**
 * Predictive Tracking — estimates aircraft position between poll cycles
 * using last known groundspeed and heading (great-circle forward projection).
 */

const EARTH_RADIUS_M = 6_371_000; // metres
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const STALE_THRESHOLD_S = 60;

/**
 * Project a new lat/lon from a start point given distance (m) and bearing (deg true north).
 * Uses the spherical-earth "destination point" formula (forward Haversine).
 */
function projectPosition(lat, lon, distanceM, bearingDeg) {
  const φ1 = lat * DEG2RAD;
  const λ1 = lon * DEG2RAD;
  const θ = bearingDeg * DEG2RAD;
  const δ = distanceM / EARTH_RADIUS_M; // angular distance

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const φ2 = Math.asin(sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * sinδ * cosφ1,
    cosδ - sinφ1 * Math.sin(φ2),
  );

  return {
    latitude: φ2 * RAD2DEG,
    longitude: ((λ2 * RAD2DEG) + 540) % 360 - 180, // normalise to -180..+180
  };
}

/**
 * Calculate an estimated position for an aircraft based on its last known
 * state and elapsed time.
 *
 * @param {Object} flightData — live data record from the store
 * @param {number} flightData.latitude       — last known lat
 * @param {number} flightData.longitude      — last known lon
 * @param {number} flightData.last_velocity  — groundspeed in m/s
 * @param {number} flightData.last_track     — heading in degrees true north
 * @param {string} flightData.last_updated   — ISO 8601 timestamp of last update
 * @param {boolean} flightData.onGround      — whether the aircraft is on the ground
 *
 * @returns {{ latitude, longitude, heading, stale, elapsedMs, predicted }}
 */
export function calculateEstimatedPosition(flightData) {
  if (!flightData?.latitude || !flightData?.longitude || !flightData?.last_updated) {
    return null;
  }

  const lastTime = new Date(flightData.last_updated).getTime();
  const elapsedMs = Date.now() - lastTime;
  const elapsedS = elapsedMs / 1000;

  // Stale — stop predicting
  if (elapsedS > STALE_THRESHOLD_S) {
    return {
      latitude: flightData.latitude,
      longitude: flightData.longitude,
      heading: flightData.last_track ?? null,
      stale: true,
      elapsedMs,
      predicted: false,
    };
  }

  const speed = flightData.last_velocity; // m/s
  const track = flightData.last_track;    // degrees

  // If on ground or missing velocity/track, return raw position
  if (flightData.onGround || !speed || speed < 2 || track == null) {
    return {
      latitude: flightData.latitude,
      longitude: flightData.longitude,
      heading: track ?? null,
      stale: false,
      elapsedMs,
      predicted: false,
    };
  }

  // Project forward
  const distanceM = speed * elapsedS;
  const { latitude, longitude } = projectPosition(
    flightData.latitude,
    flightData.longitude,
    distanceM,
    track,
  );

  return {
    latitude,
    longitude,
    heading: track,
    stale: false,
    elapsedMs,
    predicted: true,
  };
}
