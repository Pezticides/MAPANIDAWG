
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

function AppNavigation() {
  const { colors, resolvedTheme } = useSettings();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const authEventRevision = useRef(0);
  const hadAuthenticatedSession = useRef(false);

  useEffect(() => {
    let active = true;
    const revisionAtStart = authEventRevision.current;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      authEventRevision.current += 1;
      setSession(nextSession);
    });

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (active && authEventRevision.current === revisionAtStart) {
          setSession(data.session);
        }
      } catch (error) {
        console.error('Could not restore Supabase session:', error);
        if (active && authEventRevision.current === revisionAtStart) {
          Alert.alert(
            'Could not restore your session',
            'Please sign in again. Guest access is still available.'
          );
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void restoreSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (session) {
      hadAuthenticatedSession.current = true;
      if (pathname === '/' || pathname === '/auth') {
        router.replace('/explore');
      }
      return;
    }

    if (hadAuthenticatedSession.current) {
      hadAuthenticatedSession.current = false;
      router.replace('/');
    }
  }, [authReady, pathname, session]);

  const isRedirectingAuthenticatedUser =
    authReady &&
    session !== null &&
    (pathname === '/' || pathname === '/auth');

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      {(!authReady || isRedirectingAuthenticatedUser) && (
        <View
          pointerEvents="auto"
          style={[
            StyleSheet.absoluteFill,
            styles.loadingOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppNavigation />
    </SettingsProvider>
  );
}
