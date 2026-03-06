import { create } from 'zustand';

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

const useStore = create((set, get) => ({
  // Tracked aircraft list
  aircraft: loadFromStorage('aircraft', []),

  // Currently selected aircraft tail number
  selectedTail: null,

  // Live flight data keyed by ICAO24 hex
  liveData: {},

  // Flight trail points keyed by tail number
  trails: {},

  // Flight history log
  flightHistory: loadFromStorage('history', []),

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
    units: 'aviation', // aviation (knots/ft) or metric
    pollInterval: 10000,
  }),

  // Actions
  addAircraft: (aircraft) => {
    const list = [...get().aircraft, {
      id: crypto.randomUUID(),
      tailNumber: aircraft.tailNumber.toUpperCase(),
      icao24: aircraft.icao24?.toLowerCase() || '',
      nickname: aircraft.nickname || aircraft.tailNumber,
      color: aircraft.color || '#f5a623',
      emoji: aircraft.emoji || '✈️',
      aircraftType: aircraft.aircraftType || '',
      fuelCapacity: aircraft.fuelCapacity || null,
      fuelBurn: aircraft.fuelBurn || null,
      addedAt: Date.now(),
      lastSeen: null,
      status: 'unknown', // unknown, on_ground, taxiing, airborne, landed
    }];
    saveToStorage('aircraft', list);
    set({ aircraft: list });
  },

  removeAircraft: (id) => {
    const list = get().aircraft.filter(a => a.id !== id);
    saveToStorage('aircraft', list);
    set({ aircraft: list });
  },

  updateAircraft: (id, updates) => {
    const list = get().aircraft.map(a => a.id === id ? { ...a, ...updates } : a);
    saveToStorage('aircraft', list);
    set({ aircraft: list });
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

  addFlightToHistory: (flight) => {
    const history = [flight, ...get().flightHistory].slice(0, 200);
    saveToStorage('history', history);
    set({ flightHistory: history });
  },

  updateNotifications: (updates) => {
    const notifications = { ...get().notifications, ...updates };
    saveToStorage('notifications', notifications);
    set({ notifications });
  },

  updateApiKeys: (updates) => {
    const apiKeys = { ...get().apiKeys, ...updates };
    saveToStorage('apiKeys', apiKeys);
    set({ apiKeys });
  },

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    saveToStorage('settings', settings);
    set({ settings });
  },
}));

export default useStore;
