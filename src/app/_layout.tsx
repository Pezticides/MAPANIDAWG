
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { publishAuthCallbackUrl } from '../lib/authCallbackLinks';
import { isEmailVerified } from '../lib/authUtils';

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
    const subscription = Linking.addEventListener('url', ({ url }) => {
      publishAuthCallbackUrl(url);
    });

    void Linking.getInitialURL()
      .then(url => {
        if (url) publishAuthCallbackUrl(url);
      })
      .catch(error => {
        console.error('Could not read the initial app link:', error);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (session && !isEmailVerified(session.user)) {
      hadAuthenticatedSession.current = false;
      if (pathname !== '/auth/callback' && pathname !== '/auth/confirmation') {
        router.replace({
          pathname: '/auth/confirmation',
          params: { email: session.user.email ?? '' },
        });
      }
      return;
    }

    if (session) {
      hadAuthenticatedSession.current = true;
      if (
        pathname === '/' ||
        pathname === '/auth' ||
        pathname === '/auth/confirmation'
      ) {
        router.replace('/explore');
      }
      return;
    }

    if (hadAuthenticatedSession.current) {
      hadAuthenticatedSession.current = false;
      router.replace('/');
    }
  }, [authReady, pathname, session]);

  const isRedirecting = Boolean(
    authReady &&
    ((session &&
      isEmailVerified(session.user) &&
      (pathname === '/' ||
        pathname === '/auth' ||
        pathname === '/auth/confirmation')) ||
      (session &&
        !isEmailVerified(session.user) &&
        pathname !== '/auth/callback' &&
        pathname !== '/auth/confirmation'))
  );

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      {(!authReady || isRedirecting) && (
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
