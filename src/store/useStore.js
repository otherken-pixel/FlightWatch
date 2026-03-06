import { create } from 'zustand';
import { loadUserData, saveUserData } from '../services/firestore';

const STORAGE_KEY = 'flightwatch';

function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch { /* storage full or unavailable */ }
}

// Debounced Firestore save to avoid spamming writes
let firestoreSaveTimeout = null;
function debouncedFirestoreSave(uid, dataFn) {
  clearTimeout(firestoreSaveTimeout);
  firestoreSaveTimeout = setTimeout(() => {
    const data = dataFn();
    saveUserData(uid, { ...data, updatedAt: Date.now() }).catch(console.warn);
  }, 1500);
}

const useStore = create((set, get) => ({
  // Current authenticated user (null = guest)
  currentUser: null,

  // Tracked aircraft list
  aircraft: loadFromStorage('aircraft', []),

  // Currently selected aircraft tail number
  selectedTail: null,

  // Live flight data keyed by ICAO24 hex
  liveData: {},

  // Flight trail points keyed by tail number
  trails: {},

  // Flight history log (trips with trail data)
  flightHistory: loadFromStorage('history', []),

  // Active trips keyed by tail number (in-progress flights)
  activeTrips: {},

  // Notification settings
  notifications: loadFromStorage('notifications', {
    takeoff: true,
    landing: true,
    lostSignal: true,
    sound: true,
  }),

  // API keys
  apiKeys: loadFromStorage('apiKeys', {
    opensky: '',
    openweather: '',
    adsbExchange: '',
    flightaware: '',
  }),

  // Toast messages
  toasts: [],

  // Settings
  settings: loadFromStorage('settings', {
    mapStyle: 'dark',
    units: 'aviation',
    pollInterval: 10000,
  }),

  // Auth: set user and load cloud data
  setCurrentUser: (user) => set({ currentUser: user }),

  loadCloudData: async (uid) => {
    try {
      const data = await loadUserData(uid);
      if (!data) return;
      const updates = {};
      if (data.aircraft && data.aircraft.length > 0) {
        updates.aircraft = data.aircraft;
        saveToStorage('aircraft', data.aircraft);
      }
      if (data.flightHistory && data.flightHistory.length > 0) {
        updates.flightHistory = data.flightHistory;
        saveToStorage('history', data.flightHistory);
      }
      if (data.notifications) {
        updates.notifications = data.notifications;
        saveToStorage('notifications', data.notifications);
      }
      if (data.apiKeys) {
        updates.apiKeys = data.apiKeys;
        saveToStorage('apiKeys', data.apiKeys);
      }
      if (data.settings) {
        updates.settings = { ...get().settings, ...data.settings };
        saveToStorage('settings', updates.settings);
      }
      if (Object.keys(updates).length > 0) set(updates);
    } catch (err) {
      console.warn('[FlightWatch] Failed to load cloud data:', err);
    }
  },

  // Save all persistable data to Firestore
  syncToCloud: () => {
    const { currentUser, aircraft, flightHistory, notifications, apiKeys, settings } = get();
    if (!currentUser) return;
    debouncedFirestoreSave(currentUser.uid, () => ({
      aircraft,
      flightHistory,
      notifications,
      apiKeys,
      settings,
    }));
  },

  // Actions
  addAircraft: (aircraft) => {
    const list = [...get().aircraft, {
      id: crypto.randomUUID(),
      tailNumber: aircraft.tailNumber.toUpperCase(),
      icao24: aircraft.icao24?.toLowerCase() || '',
      nickname: aircraft.nickname || aircraft.tailNumber,
      color: aircraft.color || '#0A84FF',
      emoji: aircraft.emoji || '✈️',
      aircraftType: aircraft.aircraftType || '',
      fuelCapacity: aircraft.fuelCapacity || null,
      fuelBurn: aircraft.fuelBurn || null,
      addedAt: Date.now(),
      lastSeen: null,
      status: 'unknown',
    }];
    saveToStorage('aircraft', list);
    set({ aircraft: list });
    get().syncToCloud();
  },

  removeAircraft: (id) => {
    const list = get().aircraft.filter(a => a.id !== id);
    saveToStorage('aircraft', list);
    set({ aircraft: list });
    get().syncToCloud();
  },

  updateAircraft: (id, updates) => {
    const list = get().aircraft.map(a => a.id === id ? { ...a, ...updates } : a);
    saveToStorage('aircraft', list);
    set({ aircraft: list });
    get().syncToCloud();
  },

  setSelectedTail: (tail) => set({ selectedTail: tail }),

  updateLiveData: (icao24, data) => {
    const liveData = { ...get().liveData, [icao24]: { ...data, updatedAt: Date.now() } };
    set({ liveData });
  },

  addTrailPoint: (tailNumber, point) => {
    const trails = { ...get().trails };
    const trail = trails[tailNumber] || [];
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    trails[tailNumber] = [...trail.filter(p => p.timestamp > thirtyMinAgo), {
      lat: point.lat,
      lng: point.lng,
      alt: point.alt,
      timestamp: Date.now(),
    }];
    set({ trails });
  },

  clearTrail: (tailNumber) => {
    const trails = { ...get().trails };
    delete trails[tailNumber];
    set({ trails });
  },

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const toasts = [...get().toasts, { ...toast, id, createdAt: Date.now() }];
    set({ toasts });
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    }, toast.duration || 5000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  // Start an active trip when takeoff is detected
  startTrip: (tailNumber, aircraft, startData) => {
    const activeTrips = { ...get().activeTrips };
    activeTrips[tailNumber] = {
      id: crypto.randomUUID(),
      tailNumber,
      nickname: aircraft.nickname,
      icao24: aircraft.icao24,
      emoji: aircraft.emoji,
      aircraftType: aircraft.aircraftType || '',
      startedAt: Date.now(),
      departureAirport: startData.airport || null,
      departureCoords: startData.coords || null,
      trail: startData.coords ? [{ ...startData.coords, alt: startData.alt || 0, timestamp: Date.now() }] : [],
      lastState: startData.state || null,
    };
    set({ activeTrips });
  },

  // Add a point to the active trip trail
  addTripTrailPoint: (tailNumber, point) => {
    const activeTrips = { ...get().activeTrips };
    const trip = activeTrips[tailNumber];
    if (!trip) return;
    trip.trail = [...trip.trail, { lat: point.lat, lng: point.lng, alt: point.alt, timestamp: Date.now() }];
    trip.lastState = point.state || trip.lastState;
    activeTrips[tailNumber] = { ...trip };
    set({ activeTrips });
  },

  // Complete a trip and save to history
  completeTrip: (tailNumber, endData) => {
    const activeTrips = { ...get().activeTrips };
    const trip = activeTrips[tailNumber];
    if (!trip) return;

    const completedTrip = {
      ...trip,
      endedAt: Date.now(),
      duration: Date.now() - trip.startedAt,
      arrivalAirport: endData.airport || null,
      arrivalCoords: endData.coords || null,
      maxAltitude: Math.max(0, ...trip.trail.map(p => p.alt || 0)),
      maxSpeed: endData.maxSpeed || 0,
    };

    delete activeTrips[tailNumber];
    const history = [completedTrip, ...get().flightHistory].slice(0, 200);
    saveToStorage('history', history);
    set({ flightHistory: history, activeTrips });
    get().syncToCloud();
  },

  // Get active trip for a tail number
  getActiveTrip: (tailNumber) => {
    return get().activeTrips[tailNumber] || null;
  },

  // Get trips for a specific tail number
  getTripsForAircraft: (tailNumber) => {
    return get().flightHistory.filter(t => t.tailNumber === tailNumber);
  },

  addFlightToHistory: (flight) => {
    const history = [flight, ...get().flightHistory].slice(0, 200);
    saveToStorage('history', history);
    set({ flightHistory: history });
    get().syncToCloud();
  },

  updateNotifications: (updates) => {
    const notifications = { ...get().notifications, ...updates };
    saveToStorage('notifications', notifications);
    set({ notifications });
    get().syncToCloud();
  },

  updateApiKeys: (updates) => {
    const apiKeys = { ...get().apiKeys, ...updates };
    saveToStorage('apiKeys', apiKeys);
    set({ apiKeys });
    get().syncToCloud();
  },

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    saveToStorage('settings', settings);
    set({ settings });
    get().syncToCloud();
  },
}));

export default useStore;
