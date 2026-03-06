import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase.js';

/**
 * Load all user data (aircraft, settings, notifications, apiKeys, history).
 */
export async function loadUserData(uid) {
  if (!firebaseConfigured || !db) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Save complete user data document.
 */
export async function saveUserData(uid, data) {
  if (!firebaseConfigured || !db) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
}

/**
 * Save individual aircraft list.
 */
export async function saveAircraft(uid, aircraft) {
  await saveUserData(uid, { aircraft, updatedAt: Date.now() });
}

/**
 * Save flight history.
 */
export async function saveHistory(uid, history) {
  await saveUserData(uid, { flightHistory: history, updatedAt: Date.now() });
}

/**
 * Save user settings.
 */
export async function saveSettings(uid, settings) {
  await saveUserData(uid, { settings, updatedAt: Date.now() });
}

/**
 * Save notification preferences.
 */
export async function saveNotifications(uid, notifications) {
  await saveUserData(uid, { notifications, updatedAt: Date.now() });
}

/**
 * Save API keys.
 */
export async function saveApiKeys(uid, apiKeys) {
  await saveUserData(uid, { apiKeys, updatedAt: Date.now() });
}

/**
 * Migrate localStorage data to Firestore for a newly signed-in user.
 * Only migrates if Firestore has no existing data.
 */
export async function migrateLocalData(uid) {
  const existing = await loadUserData(uid);
  if (existing && existing.aircraft && existing.aircraft.length > 0) {
    // User already has cloud data — don't overwrite
    return { migrated: false, data: existing };
  }

  // Gather local data
  const STORAGE_KEY = 'flightwatch';
  function loadLocal(key, fallback) {
    try {
      const d = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
  }

  const localAircraft = loadLocal('aircraft', []);
  const localHistory = loadLocal('history', []);
  const localNotifications = loadLocal('notifications', null);
  const localApiKeys = loadLocal('apiKeys', null);
  const localSettings = loadLocal('settings', null);

  // Only migrate if there's local data worth saving
  if (localAircraft.length === 0 && localHistory.length === 0) {
    return { migrated: false, data: null };
  }

  const data = {
    aircraft: localAircraft,
    flightHistory: localHistory,
    updatedAt: Date.now(),
  };
  if (localNotifications) data.notifications = localNotifications;
  if (localApiKeys) data.apiKeys = localApiKeys;
  if (localSettings) data.settings = localSettings;

  await saveUserData(uid, data);
  return { migrated: true, data };
}
