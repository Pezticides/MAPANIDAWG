
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentProfile,
  getSavedLocationsKey,
} from './localProfile';

const LEGACY_STORAGE_KEY = 'ustp_saved_locations';

export async function getSavedLocationIds(): Promise<string[]> {
  const profile = await getCurrentProfile();
  const storageKey = profile
    ? getSavedLocationsKey(profile.email)
    : LEGACY_STORAGE_KEY;

  let stored = await AsyncStorage.getItem(storageKey);

  // Migrate older saved locations to the current profile.
  if (!stored && profile) {
    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);

    if (legacy) {
      stored = legacy;
      await AsyncStorage.setItem(storageKey, legacy);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

export async function updateSavedLocationIds(
  ids: string[],
): Promise<void> {
  const profile = await getCurrentProfile();
  const storageKey = profile
    ? getSavedLocationsKey(profile.email)
    : LEGACY_STORAGE_KEY;

  await AsyncStorage.setItem(storageKey, JSON.stringify(ids));
}

export async function toggleSavedLocation(
  placeId: string | number,
): Promise<string[]> {
  const id = String(placeId);
  const current = await getSavedLocationIds();

  const updated = current.includes(id)
    ? current.filter(item => item !== id)
    : [...current, id];

  await updateSavedLocationIds(updated);
  return updated;
}

export async function removeSavedLocation(
  placeId: string | number,
): Promise<string[]> {
  const id = String(placeId);
  const current = await getSavedLocationIds();
  const updated = current.filter(item => item !== id);

  await updateSavedLocationIds(updated);
  return updated;
}
