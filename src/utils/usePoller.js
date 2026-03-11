import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import {
  fetchOpenSkyMultiple,
  fetchAdsbLolMultiple,
  fetchAdsbLolByReg,
  fetchAirplanesLiveMultiple,
  fetchAirplanesLiveByReg,
} from './api';
import { determineFlightState, getStateTransitionEvent, isSignalLost } from './flightStateMachine';
import { sendNotification, playNotificationSound } from './notifications';
import { findNearestAirport } from './airports';

/**
 * Custom hook that polls ADS-B data for all tracked aircraft
 * and manages trip lifecycle (start/trail/complete)
 */
export function usePoller() {
  const intervalRef = useRef(null);
  const pollRef = useRef(null);
  const maxSpeedRef = useRef({});
  const settings = useStore(s => s.settings);

  useEffect(() => {
    const poll = async () => {
      // Read fresh state each poll to avoid stale closures
      const {
        aircraft,
        notifications,
        updateLiveData,
        updateAircraft,
        addTrailPoint,
        addToast,
        startTrip,
        addTripTrailPoint,
        completeTrip,
      } = useStore.getState();

      const tracked = aircraft.filter(a => a.icao24);
      if (tracked.length === 0) return;

      try {
        const icaoList = tracked.map(a => a.icao24);

        // Query all three sources in parallel; none should kill the others
        const [openSkyResult, adsbLolResult, airplanesLiveResult] = await Promise.allSettled([
          fetchOpenSkyMultiple(icaoList),
          fetchAdsbLolMultiple(icaoList),
          fetchAirplanesLiveMultiple(icaoList),
        ]);

        const openSkyStates = openSkyResult.status === 'fulfilled' ? openSkyResult.value : [];
        const adsbLolStates = adsbLolResult.status === 'fulfilled' ? adsbLolResult.value : [];
        const airplanesLiveStates = airplanesLiveResult.status === 'fulfilled' ? airplanesLiveResult.value : [];

        if (openSkyResult.status === 'rejected') {
          console.warn('OpenSky fetch failed:', openSkyResult.reason?.message);
        }

        // Merge: later sources overwrite earlier; prefer volunteer networks over OpenSky
        const statesByIcao = new Map();
        for (const s of openSkyStates) statesByIcao.set(s.icao24, s);
        for (const s of adsbLolStates) statesByIcao.set(s.icao24, s);
        for (const s of airplanesLiveStates) statesByIcao.set(s.icao24, s);

        // Fallback: for aircraft still missing, try by registration number.
        // Catches cases where hex conversion doesn't match the transponder.
        const missingAircraft = tracked.filter(a => !statesByIcao.has(a.icao24));
        if (missingAircraft.length > 0) {
          const tailNumbers = missingAircraft.map(a => a.tailNumber);
          const matchRegResult = (s) => {
            return missingAircraft.find(
              a => a.tailNumber.toUpperCase() === (s.registration || s.callsign || '').toUpperCase()
                || s.icao24 === a.icao24
            );
          };
          try {
            const [adsbRegResult, alRegResult] = await Promise.allSettled([
              fetchAdsbLolByReg(tailNumbers),
              fetchAirplanesLiveByReg(tailNumbers),
            ]);
            const regStates = [
              ...(adsbRegResult.status === 'fulfilled' ? adsbRegResult.value : []),
              ...(alRegResult.status === 'fulfilled' ? alRegResult.value : []),
            ];
            for (const s of regStates) {
              const match = matchRegResult(s);
              if (match && !statesByIcao.has(match.icao24)) {
                statesByIcao.set(match.icao24, { ...s, icao24: match.icao24 });
              }
            }
          } catch (err) {
            console.warn('Registration fallback failed:', err.message);
          }
        }

        const states = [...statesByIcao.values()];

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

            // Track max speed for trip
            if (state.velocity) {
              const current = maxSpeedRef.current[ac.tailNumber] || 0;
              if (state.velocity > current) {
                maxSpeedRef.current[ac.tailNumber] = state.velocity;
              }
            }

            // Add trail point if airborne
            if (newState === 'airborne') {
              const point = {
                lat: state.latitude,
                lng: state.longitude,
                alt: state.baroAltitude,
              };
              addTrailPoint(ac.tailNumber, point);

              // Also add to active trip trail
              addTripTrailPoint(ac.tailNumber, {
                ...point,
                state: {
                  altitude: state.baroAltitude,
                  speed: state.velocity,
                  heading: state.heading,
                  verticalRate: state.verticalRate,
                  squawk: state.squawk,
                  callsign: state.callsign,
                },
              });
            }

            // Handle state transition events
            if (event === 'takeoff') {
              const airport = findNearestAirport(state.latitude, state.longitude);

              // Start a new trip
              maxSpeedRef.current[ac.tailNumber] = 0;
              startTrip(ac.tailNumber, ac, {
                airport: airport && airport.distance < 5 ? airport.icao : null,
                coords: { lat: state.latitude, lng: state.longitude },
                alt: state.baroAltitude,
                state: {
                  altitude: state.baroAltitude,
                  speed: state.velocity,
                  heading: state.heading,
                  callsign: state.callsign,
                },
              });

              if (notifications.takeoff) {
                const msg = airport && airport.distance < 5
                  ? `${ac.nickname} just took off near ${airport.icao}!`
                  : `${ac.nickname} is airborne!`;
                addToast({ type: 'takeoff', title: 'Takeoff Detected', message: msg });
                sendNotification('FlightWatch', msg);
                if (notifications.sound) playNotificationSound('takeoff');
              }
            }

            if (event === 'landing') {
              const airport = findNearestAirport(state.latitude, state.longitude);

              // Complete the active trip
              completeTrip(ac.tailNumber, {
                airport: airport && airport.distance < 5 ? airport.icao : null,
                coords: { lat: state.latitude, lng: state.longitude },
                maxSpeed: maxSpeedRef.current[ac.tailNumber] || 0,
              });
              maxSpeedRef.current[ac.tailNumber] = 0;

              if (notifications.landing) {
                const msg = airport && airport.distance < 5
                  ? `${ac.nickname} landed at ${airport.icao} — safe and sound!`
                  : `${ac.nickname} has landed — safe and sound!`;
                addToast({ type: 'landing', title: 'Landing Detected', message: msg });
                sendNotification('FlightWatch', msg);
                if (notifications.sound) playNotificationSound('landing');
              }
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

    pollRef.current = poll;
    useStore.getState().setRefreshNow(() => {
      if (pollRef.current) pollRef.current();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => pollRef.current?.(), settings.pollInterval);
    });

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, settings.pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.pollInterval]);

}
