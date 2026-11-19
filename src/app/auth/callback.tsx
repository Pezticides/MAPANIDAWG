import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../../context/SettingsContext';
import {
  consumeAuthCallbackUrl,
  subscribeToAuthCallbackUrls,
} from '../../lib/authCallbackLinks';
import { isEmailVerified } from '../../lib/authUtils';
import { ensureProfileExists } from '../../lib/localProfile';
import { supabase } from '../../lib/supabase';

type CallbackStatus = 'processing' | 'error';

function getCallbackParameters(url: string): URLSearchParams {
  const parsedUrl = new URL(url);
  const hash = parsedUrl.hash.startsWith('#')
    ? parsedUrl.hash.slice(1)
    : parsedUrl.hash;
  const hashParameters = new URLSearchParams(hash);
  const parameters = new URLSearchParams(parsedUrl.search);

  hashParameters.forEach((value, key) => {
    if (!parameters.has(key)) parameters.set(key, value);
  });

  return parameters;
}

export default function AuthCallbackScreen() {
  const { colors } = useSettings();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState('Verifying your email confirmation…');
  const processing = useRef(false);
  const handledUrl = useRef<string | null>(null);

  const processCallback = useCallback(async (url: string, retry = false) => {
    if (processing.current || (!retry && handledUrl.current === url)) return;

    processing.current = true;
    handledUrl.current = url;
    consumeAuthCallbackUrl(url);
    setStatus('processing');
    setMessage('Verifying your email confirmation…');

    try {
      const { data: currentSession, error: currentSessionError } =
        await supabase.auth.getSession();
      if (currentSessionError) throw currentSessionError;

      if (
        currentSession.session &&
        isEmailVerified(currentSession.session.user)
      ) {
        await ensureProfileExists(currentSession.session.user);
        router.replace('/explore');
        return;
      }

      const parameters = getCallbackParameters(url);
      const authError =
        parameters.get('error_description') || parameters.get('error');
      if (authError) {
        throw new Error(
          authError.toLowerCase().includes('expired')
            ? 'This confirmation link has expired. Request a new email and try again.'
            : 'This confirmation link is invalid or has already been used.'
        );
      }

      const accessToken = parameters.get('access_token');
      const refreshToken = parameters.get('refresh_token');
      if (!accessToken || !refreshToken) {
        throw new Error(
          'The confirmation link is incomplete. Request a new email and try again.'
        );
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) {
        throw new Error('Could not confirm the account. Please try again.');
      }
      if (!isEmailVerified(userData.user)) {
        throw new Error(
          'Your email is not confirmed yet. Open the latest confirmation email and try again.'
        );
      }

      await ensureProfileExists(userData.user);
      setMessage('Email confirmed. Opening Explore Buildings…');
      router.replace('/explore');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not verify the confirmation link. Please try again.'
      );
    } finally {
      processing.current = false;
    }
  }, []);

  useEffect(() => {
    let receivedCallback = false;
    const unsubscribe = subscribeToAuthCallbackUrls(url => {
      receivedCallback = true;
      void processCallback(url);
    });

    const timeout = setTimeout(() => {
      if (!receivedCallback && !processing.current) {
        setStatus('error');
        setMessage('No confirmation link was received. Open the link from your email.');
      }
    }, 8000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [processCallback]);

  function retry() {
    if (handledUrl.current) {
      void processCallback(handledUrl.current, true);
    } else {
      router.replace('/auth');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {status === 'processing' ? (
          <ActivityIndicator size="large" color="#1A73E8" />
        ) : (
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={34} color="#B42318" />
          </View>
        )}

        <Text style={[styles.title, { color: colors.text }]}>
          {status === 'processing' ? 'Confirming your email' : 'Link not verified'}
        </Text>
        <Text
          style={[styles.message, { color: colors.secondaryText }]}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>

        {status === 'error' && (
          <>
            <Pressable style={styles.primaryButton} onPress={retry}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.replace('/auth/confirmation')}
            >
              <Text style={styles.secondaryButtonText}>
                Back to confirmation options
              </Text>
            </Pressable>
            <Pressable
              style={styles.textButton}
              onPress={() => router.replace('/auth')}
            >
              <Text style={styles.textButtonLabel}>Back to login</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    alignItems: 'center',
    padding: 26,
    borderRadius: 22,
  },
  errorIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF1F0',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },
  primaryButton: {
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    marginTop: 23,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: '#31506F',
    fontSize: 13,
    fontWeight: '700',
  },
  textButton: {
    paddingVertical: 8,
  },
  textButtonLabel: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '800',
  },
});
