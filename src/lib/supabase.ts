
// Import the URL polyfill required by Supabase in React Native.
import 'react-native-url-polyfill/auto';

// Import AsyncStorage to persist login sessions.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import React Native app state utilities.
import { AppState, Platform } from 'react-native';

// Import Supabase client creator.
import { createClient } from '@supabase/supabase-js';

// Read credentials from your project's .env file.
// Expo uses EXPO_PUBLIC_* variables, while older templates may still use NEXT_PUBLIC_*.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Stop the app early if the credentials are missing.
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase configuration missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.'
  );
}

// Create the shared Supabase client.
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      // Save the session on the device.
      storage: AsyncStorage,

      // Automatically refresh expired access tokens.
      autoRefreshToken: true,

      // Keep the user signed in after restarting the app.
      persistSession: true,

      // Deep-link handling will be configured separately.
      detectSessionInUrl: false,
    },
  }
);

// Automatically pause token refresh when the app is inactive.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
