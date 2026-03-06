import { msToKnots } from './api';

/**
 * Flight state machine
 * States: unknown → on_ground → taxiing → airborne → landed
 *
 * Transitions:
 * - on_ground: onGround=true, speed < 5kts
 * - taxiing: onGround=true, speed > 5kts
 * - airborne: onGround=false OR (altitude increasing + speed > 40kts)
 * - landed: was airborne, now onGround=true + speed < 40kts
 */

export function determineFlightState(currentState, liveData, previousData) {
  if (!liveData) return currentState || 'unknown';

  const speedKnots = msToKnots(liveData.velocity);
  const isOnGround = liveData.onGround;
  const altFeet = liveData.baroAltitude ? liveData.baroAltitude * 3.28084 : 0;

  // Simple state transitions
  if (isOnGround) {
    if (currentState === 'airborne') {
      // Just landed
      return 'landed';
    }
    if (speedKnots > 5) {
      return 'taxiing';
    }
    return 'on_ground';
  }

  // Not on ground
  if (speedKnots > 40 || altFeet > 500) {
    return 'airborne';
  }

  // Low speed, not on ground — possibly just lifted off
  if (currentState === 'taxiing' || currentState === 'on_ground') {
    return 'airborne';
  }

  return currentState === 'unknown' ? 'on_ground' : currentState;
}

/**
 * Check if a state transition should trigger a notification
 */
export function getStateTransitionEvent(oldState, newState) {
  if (oldState !== 'airborne' && newState === 'airborne') {
    return 'takeoff';
  }
  if (oldState === 'airborne' && (newState === 'landed' || newState === 'on_ground')) {
    return 'landing';
  }
  return null;
}

/**
 * Check if signal is lost (no update in >5 minutes)
 */
export function isSignalLost(lastUpdateTime) {
  if (!lastUpdateTime) return false;
  return Date.now() - lastUpdateTime > 5 * 60 * 1000;
}
