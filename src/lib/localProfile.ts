import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

const PROFILES_KEY = 'ustp_local_profiles_v1';
const CURRENT_PROFILE_KEY = 'ustp_current_profile_email_v1';
const SAVED_LOCATIONS_PREFIX = 'ustp_saved_locations_v1:';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readProfiles(): Promise<LocalProfile[]> {
  const raw = await AsyncStorage.getItem(PROFILES_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalProfile =>
      !!item && typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.email === 'string' &&
      typeof item.createdAt === 'string'
    );
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: LocalProfile[]) {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function createLocalProfile(name: string, email: string): Promise<LocalProfile> {
  const normalizedEmail = normalizeEmail(email);
  const profiles = await readProfiles();
  if (profiles.some(profile => profile.email === normalizedEmail)) {
    throw new Error('An account with this email already exists on this device. Sign in instead.');
  }

  const profile: LocalProfile = {
    id: normalizedEmail,
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  await writeProfiles([...profiles, profile]);
  await AsyncStorage.setItem(CURRENT_PROFILE_KEY, profile.email);
  return profile;
}

export async function signInLocalProfile(email: string): Promise<LocalProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  const profiles = await readProfiles();
  const profile = profiles.find(item => item.email === normalizedEmail) ?? null;
  if (profile) await AsyncStorage.setItem(CURRENT_PROFILE_KEY, profile.email);
  return profile;
}

export async function getCurrentProfile(): Promise<LocalProfile | null> {
  const email = await AsyncStorage.getItem(CURRENT_PROFILE_KEY);
  if (!email) return null;
  const profiles = await readProfiles();
  return profiles.find(profile => profile.email === normalizeEmail(email)) ?? null;
}

export async function updateLocalProfileName(email: string, name: string): Promise<LocalProfile> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Enter your name before saving.');

  const profiles = await readProfiles();
  const index = profiles.findIndex(profile => profile.email === normalizedEmail);
  if (index < 0) throw new Error('This local profile could not be found. Please sign in again.');

  const updated: LocalProfile = { ...profiles[index], name: normalizedName };
  profiles[index] = updated;
  await writeProfiles(profiles);
  return updated;
}

export async function signOutLocalProfile() {
  await AsyncStorage.removeItem(CURRENT_PROFILE_KEY);
}

export function getSavedLocationsKey(email: string) {
  return `${SAVED_LOCATIONS_PREFIX}${normalizeEmail(email)}`;
}
