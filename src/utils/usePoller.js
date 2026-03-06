import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { fetchOpenSkyMultiple, reverseGeocode } from './api';
import { determineFlightState, getStateTransitionEvent, isSignalLost } from './flightStateMachine';
import { sendNotification, playNotificationSound } from './notifications';
import { findNearestAirport } from './airports';

/**
 * Custom hook that polls ADS-B data for all tracked aircraft
 */
export function usePoller() {
  const intervalRef = useRef(null);
  const aircraft = useStore(s => s.aircraft);
  const settings = useStore(s => s.settings);
  const notifications = useStore(s => s.notifications);
  const updateLiveData = useStore(s => s.updateLiveData);
  const updateAircraft = useStore(s => s.updateAircraft);
  const addTrailPoint = useStore(s => s.addTrailPoint);
  const addToast = useStore(s => s.addToast);
  const addFlightToHistory = useStore(s => s.addFlightToHistory);

  useEffect(() => {
    const poll = async () => {
      const tracked = aircraft.filter(a => a.icao24);
      if (tracked.length === 0) return;

      try {
        const icaoList = tracked.map(a => a.icao24);
        const states = await fetchOpenSkyMultiple(icaoList);

        for (const ac of tracked) {
          const state = states.find(s => s.icao24 === ac.icao24);

          if (state && state.latitude != null && state.longitude != null) {
            const oldState = ac.status;
            const newState = determineFlightState(oldState, state);
            const event = getStateTransitionEvent(oldState, newState);

            // Update live data
            updateLiveData(ac.icao24, state);

            // Update aircraft status
            updateAircraft(ac.id, {
              status: newState,
              lastSeen: Date.now(),
            });

            // Add trail point if airborne
            if (newState === 'airborne') {
              addTrailPoint(ac.tailNumber, {
                lat: state.latitude,
                lng: state.longitude,
                alt: state.baroAltitude,
              });
            }

            // Handle state transition events
            if (event === 'takeoff' && notifications.takeoff) {
              const airport = findNearestAirport(state.latitude, state.longitude);
              const msg = airport && airport.distance < 5
                ? `${ac.nickname} just took off near ${airport.icao}!`
                : `${ac.nickname} is airborne!`;
              addToast({ type: 'takeoff', title: 'Takeoff Detected', message: msg });
              sendNotification('FlightWatch', msg);
              if (notifications.sound) playNotificationSound('takeoff');
            }

            if (event === 'landing' && notifications.landing) {
              const airport = findNearestAirport(state.latitude, state.longitude);
              const msg = airport && airport.distance < 5
                ? `${ac.nickname} landed at ${airport.icao} — safe and sound!`
                : `${ac.nickname} has landed — safe and sound!`;
              addToast({ type: 'landing', title: 'Landing Detected', message: msg });
              sendNotification('FlightWatch', msg);
              if (notifications.sound) playNotificationSound('landing');

              // Log to history
              addFlightToHistory({
                id: crypto.randomUUID(),
                tailNumber: ac.tailNumber,
                nickname: ac.nickname,
                landedAt: Date.now(),
                nearAirport: airport?.icao || 'Unknown',
              });
            }
          } else {
            // No data returned for this aircraft
            if (ac.status === 'airborne' && isSignalLost(ac.lastSeen) && notifications.lostSignal) {
              addToast({
                type: 'warning',
                title: 'Signal Lost',
                message: `Signal lost for ${ac.nickname} for 5+ minutes`,
              });
              sendNotification('FlightWatch', `Signal lost for ${ac.nickname} for 5+ minutes`);
            }
          }
        }
      } catch (err) {
        console.warn('Polling error:', err.message);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, settings.pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [aircraft.length, settings.pollInterval]);
}
