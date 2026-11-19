
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Supabase client
import { supabase } from '../lib/supabase';
import { AUTH_CALLBACK_URL, isEmailVerified } from '../lib/authUtils';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    params.mode === 'signup' ? 'signup' : 'signin'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : ''
  );
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Validate and process registration or login.
  async function handleContinue() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Basic input validation.
    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing information',
        'Enter your email and password to continue.'
      );
      return;
    }

    // Validate email format.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    // Validate registration name.
    if (mode === 'signup' && !cleanName) {
      Alert.alert('Missing information', 'Enter your full name.');
      return;
    }

    // Supabase password minimum.
    if (password.length < 8) {
      Alert.alert(
        'Weak password',
        'Your password must contain at least 8 characters.'
      );
      return;
    }

    setBusy(true);

    try {
      if (mode === 'signup') {
        // Create a real Supabase Auth account.
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: AUTH_CALLBACK_URL,
            data: {
              full_name: cleanName,
            },
          },
        });

        if (error) throw error;

        if (data.user?.identities?.length === 0) {
          showDuplicateAccountOptions(cleanEmail);
          return;
        }

        if (!data.user) {
          throw new Error('Supabase did not return the new account.');
        }

        if (data.session && isEmailVerified(data.user)) {
          router.replace('/explore');
          return;
        }

        router.replace({
          pathname: '/auth/confirmation',
          params: { email: cleanEmail },
        });
      } else {
        // Authenticate using the actual email and password.
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (!data.session) {
          throw new Error('No active session was created. Please try again.');
        }

        if (!isEmailVerified(data.user)) {
          router.replace({
            pathname: '/auth/confirmation',
            params: { email: cleanEmail },
          });
          return;
        }

        router.replace('/explore');
      }
    } catch (error) {
      if (mode === 'signup' && isDuplicateEmailError(error)) {
        showDuplicateAccountOptions(cleanEmail);
      } else if (
        mode === 'signup' &&
        isConfirmationEmailDeliveryError(error)
      ) {
        Alert.alert(
          'Confirmation email could not be sent',
          getRegistrationErrorMessage(error),
          [
            { text: 'Keep editing', style: 'cancel' },
            {
              text: 'Email options',
              onPress: () =>
                router.replace({
                  pathname: '/auth/confirmation',
                  params: { email: cleanEmail, deliveryError: 'true' },
                }),
            },
          ]
        );
      } else if (mode === 'signin' && isEmailNotConfirmedError(error)) {
        router.replace({
          pathname: '/auth/confirmation',
          params: { email: cleanEmail },
        });
      } else {
        Alert.alert(
          mode === 'signup' ? 'Registration failed' : 'Sign-in failed',
          mode === 'signup'
            ? getRegistrationErrorMessage(error)
            : getAuthErrorMessage(error)
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function isEmailNotConfirmedError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code =
      'code' in error && typeof error.code === 'string' ? error.code : '';
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
    return (
      code === 'email_not_confirmed' || /email not confirmed/i.test(message)
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={styles.back}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={23} color="#24364B" />
          </Pressable>

          <View style={styles.logo}>
            <Ionicons name="school" size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </Text>

          <Text style={styles.subtitle}>
            {mode === 'signin'
              ? 'Sign in to your USTP Campus Navigator account.'
              : 'Create an account to sync your saved campus locations.'}
          </Text>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'signin' && styles.activeTab]}
              onPress={() => setMode('signin')}
              disabled={busy}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === 'signin' && styles.activeTabText,
                ]}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, mode === 'signup' && styles.activeTab]}
              onPress={() => setMode('signup')}
              disabled={busy}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === 'signup' && styles.activeTabText,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#8A97A7"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#8A97A7"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (at least 8 characters)"
            placeholderTextColor="#8A97A7"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={busy}
          >
            <Text style={styles.buttonText}>
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </Text>

            {!busy && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </Pressable>

          <Pressable
            style={styles.guestButton}
            onPress={() => router.replace('/explore')}
            disabled={busy}
            accessibilityRole="button"
          >
            <Ionicons name="map-outline" size={18} color="#31506F" />
            <Text style={styles.guestButtonText}>Continue as guest</Text>
          </Pressable>

          <View style={styles.notice}>
            <Ionicons
              name="cloud-outline"
              size={17}
              color="#718096"
            />

            <Text style={styles.note}>
              Your account is securely authenticated through Supabase.
              Email verification is required for new registrations.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isDuplicateEmailError(error: unknown): boolean {
  const { code, message } = getAuthErrorDetails(error);
  return (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    /already registered|already exists|email exists/i.test(message)
  );
}

function isConfirmationEmailDeliveryError(error: unknown): boolean {
  const { message } = getAuthErrorDetails(error);
  return /error sending confirmation email|could not send.*confirmation email|failed to send.*confirmation email/i.test(
    message
  );
}

function showDuplicateAccountOptions(email: string): void {
  Alert.alert(
    'Email already registered',
    'This email may already have an account. Sign in, or open email options if the account still needs confirmation.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Sign in',
        onPress: () =>
          router.replace({ pathname: '/auth', params: { mode: 'signin', email } }),
      },
      {
        text: 'Email options',
        onPress: () =>
          router.replace({
            pathname: '/auth/confirmation',
            params: { email },
          }),
      },
    ]
  );
}

function getRegistrationErrorMessage(error: unknown): string {
  const { code, message, status } = getAuthErrorDetails(error);

  if (isConfirmationEmailDeliveryError(error)) {
    return 'Supabase could not deliver the confirmation email. This is usually caused by missing or invalid SMTP settings, or an email-provider limit. Check Supabase Auth email/SMTP settings. The account may already have been created; after email delivery is fixed, use Email options to resend instead of registering repeatedly.';
  }

  if (
    /redirect_to|redirect url|emailredirectto/i.test(message) &&
    /not allowed|not permitted|not whitelisted|invalid/i.test(message)
  ) {
    return `Supabase rejected the confirmation callback. Add ${AUTH_CALLBACK_URL} to the allowed redirect URLs in your Supabase Auth URL Configuration, then try again.`;
  }

  if (isDuplicateEmailError(error)) {
    return 'This email is already registered. Sign in or use a different email address.';
  }

  if (
    /rate limit|too many requests|security purposes/i.test(message) ||
    status === 429
  ) {
    return 'Too many registration attempts. Wait a little while, then try again.';
  }

  if (/network request failed|failed to fetch|network error/i.test(message)) {
    return 'Could not reach the authentication service. Check your internet connection and try again.';
  }

  if (message) return message;
  if (code) return `Registration could not be completed (${code}). Please try again.`;
  return 'Registration could not be completed. Please check your connection and try again.';
}

function getAuthErrorMessage(error: unknown): string {
  const { message, code } = getAuthErrorDetails(error);
  return message || (code ? `Authentication failed (${code}).` : 'Please try again.');
}

function getAuthErrorDetails(error: unknown): {
  code: string;
  message: string;
  status?: number;
} {
  if (!error || typeof error !== 'object') {
    return { code: '', message: '' };
  }

  return {
    code: 'code' in error && typeof error.code === 'string' ? error.code : '',
    message:
      'message' in error && typeof error.message === 'string'
        ? error.message
        : '',
    status:
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined,
  };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 26,
    paddingBottom: 30,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F2F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 29,
    fontWeight: '900',
    color: '#172B4D',
  },
  subtitle: {
    color: '#718096',
    marginTop: 8,
    marginBottom: 25,
    lineHeight: 21,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F4F8',
    borderRadius: 13,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabText: {
    color: '#8290A2',
    fontWeight: '800',
  },
  activeTabText: {
    color: '#1A73E8',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    borderRadius: 13,
    paddingHorizontal: 16,
    marginBottom: 14,
    color: '#172B4D',
    fontSize: 15,
  },
  button: {
    height: 56,
    backgroundColor: '#1A73E8',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  guestButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 15,
    marginTop: 10,
  },
  guestButtonText: {
    color: '#31506F',
    fontSize: 14,
    fontWeight: '800',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F4F6F9',
  },
  note: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#718096',
  },
});
