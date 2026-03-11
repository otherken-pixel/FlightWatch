import { useEffect, useRef, useState } from 'react';
import { calculateEstimatedPosition } from '../utils/predictiveTracking';

/**
 * Hook that returns a smoothly-animated [lat, lng, heading, stale] tuple
 * using requestAnimationFrame to project the aircraft position forward
 * between poll cycles.
 *
 * @param {Object|null} liveData — raw live data record from the store
 * @returns {{ position: [number, number]|null, heading: number|null, stale: boolean, predicted: boolean }}
 */
export function useAnimatedPosition(liveData) {
  const rafRef = useRef(null);
  const [animated, setAnimated] = useState({
    position: null,
    heading: null,
    stale: false,
    predicted: false,
  });

  useEffect(() => {
    if (!liveData?.latitude || !liveData?.longitude) {
      setAnimated({ position: null, heading: null, stale: false, predicted: false });
      return;
    }

    // If the live data has no velocity/track info, just snap to the raw position
    if (!liveData.last_updated || !liveData.last_velocity || liveData.last_velocity < 2) {
      setAnimated({
        position: [liveData.latitude, liveData.longitude],
        heading: liveData.heading ?? null,
        stale: false,
        predicted: false,
      });
      return;
    }

    let running = true;

    function tick() {
      if (!running) return;

      const est = calculateEstimatedPosition(liveData);
      if (est) {
        setAnimated({
          position: [est.latitude, est.longitude],
          heading: est.heading,
          stale: est.stale,
          predicted: est.predicted,
        });
      }

      // Stop the loop if stale
      if (est?.stale) return;

      rafRef.current = requestAnimationFrame(tick);
    }

    // Kick off the animation loop
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    liveData?.latitude,
    liveData?.longitude,
    liveData?.last_updated,
    liveData?.last_velocity,
    liveData?.last_track,
  ]);

  return animated;
}
