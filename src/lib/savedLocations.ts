
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Guest bookmarks stay on this device.
const GUEST_STORAGE_KEY = 'ustp_saved_locations';

// Get the current authenticated Supabase user ID.
// A null result means the visitor is using guest mode.
async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  return data.session?.user.id ?? null;
}

// Read bookmark IDs.
export async function getSavedLocationIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId();

  // GUEST MODE: read only local guest bookmarks.
  if (!userId) {
    const stored = await AsyncStorage.getItem(GUEST_STORAGE_KEY);

    if (!stored) return [];

    try {
      const parsed: unknown = JSON.parse(stored);

      return Array.isArray(parsed)
        ? [...new Set(parsed.map(String))]
        : [];
    } catch {
      return [];
    }
  }

  // SIGNED-IN MODE: read only this user's cloud bookmarks.
  const { data, error } = await supabase
    .from('saved_locations')
    .select('location_id')
    .eq('user_id', userId);

  if (error) throw error;

  return [...new Set((data ?? []).map(item => item.location_id))];
}

// Replace the current bookmark list.
export async function updateSavedLocationIds(
  ids: string[]
): Promise<void> {
  const cleanIds = [...new Set(ids.map(String).filter(Boolean))];

  const userId = await getAuthenticatedUserId();

  // GUEST MODE: save locally, without touching cloud bookmarks.
  if (!userId) {
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify(cleanIds)
    );

    return;
  }

  // SIGNED-IN MODE: read this user's existing cloud bookmarks.
  const { data: existingRows, error: readError } = await supabase
    .from('saved_locations')
    .select('location_id')
    .eq('user_id', userId);

  if (readError) throw readError;

  const existingIds = (existingRows ?? []).map(
    row => row.location_id
  );

  const idsToAdd = cleanIds.filter(
    id => !existingIds.includes(id)
  );

  const idsToRemove = existingIds.filter(
    id => !cleanIds.includes(id)
  );

  // Insert only new bookmarks.
  if (idsToAdd.length > 0) {
    const rows = idsToAdd.map(locationId => ({
      user_id: userId,
      location_id: locationId,
    }));

    const { error: insertError } = await supabase
      .from('saved_locations')
      .insert(rows);

    if (insertError) throw insertError;
  }

  // Delete only bookmarks removed by this user.
  if (idsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('saved_locations')
      .delete()
      .eq('user_id', userId)
      .in('location_id', idsToRemove);

    if (deleteError) throw deleteError;
  }
}

// Add or remove one saved campus location.
export async function toggleSavedLocation(
  placeId: string | number
): Promise<string[]> {
  const id = String(placeId);
  const current = await getSavedLocationIds();

  const updated = current.includes(id)
    ? current.filter(item => item !== id)
    : [...current, id];

  await updateSavedLocationIds(updated);

  return updated;
}

// Remove one saved campus location.
export async function removeSavedLocation(
  placeId: string | number
): Promise<string[]> {
  const id = String(placeId);
  const current = await getSavedLocationIds();

  const updated = current.filter(item => item !== id);

  await updateSavedLocationIds(updated);

  return updated;
}
