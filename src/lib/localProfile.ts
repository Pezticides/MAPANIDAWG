
import { supabase } from './supabase';

// Keep this interface compatible with your existing map/profile screens.
export type LocalProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

// Get the currently authenticated Supabase profile.
// Guests receive null.
export async function getCurrentProfile(): Promise<LocalProfile | null> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    if (authError.message.toLowerCase().includes('session')) {
      return null;
    }

    throw authError;
  }

  const user = authData.user;

  if (!user) return null;

  // Read the user's public profile from the database.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: user.id,
    name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      '',
    email: user.email || '',
    createdAt: profile?.created_at || user.created_at,
  };
}

// Update the authenticated user's name.
export async function updateLocalProfileName(
  email: string,
  name: string
): Promise<LocalProfile> {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error('Enter your name before saving.');
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  const user = authData.user;

  if (!user || user.email?.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error('You must be signed in to update this profile.');
  }

  // Update the public profile table.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: cleanName })
    .eq('id', user.id);

  if (profileError) throw profileError;

  // Keep the Auth metadata name synchronized.
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: cleanName,
    },
  });

  if (metadataError) throw metadataError;

  const updatedProfile = await getCurrentProfile();

  if (!updatedProfile) {
    throw new Error('Could not reload your updated profile.');
  }

  return updatedProfile;
}

// Sign out of the actual Supabase account.
export async function signOutLocalProfile(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

// Legacy functions are intentionally blocked.
// They must not create or authenticate accounts without passwords.
export async function createLocalProfile(
  _name: string,
  _email: string
): Promise<never> {
  throw new Error(
    'Local account creation is disabled. Use Supabase email and password registration.'
  );
}

export async function signInLocalProfile(
  _email: string
): Promise<null> {
  return null;
}

// Retained only for compatibility with older imports.
// Cloud bookmarks are now stored using the authenticated user ID.
export function getSavedLocationsKey(email: string): string {
  return `ustp_saved_locations_v1:${email.trim().toLowerCase()}`;
}
