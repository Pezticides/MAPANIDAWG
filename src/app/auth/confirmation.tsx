import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import { AUTH_CALLBACK_URL, isEmailVerified } from '../../lib/authUtils';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

export default function EmailConfirmationScreen() {
  const { colors } = useSettings();
  const params = useLocalSearchParams<{
    email?: string;
    deliveryError?: string;
  }>();
  const deliveryFailure = params.deliveryError === 'true';
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : ''
  );
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [message, setMessage] = useState(
    deliveryFailure
      ? 'Supabase could not send the confirmation email. Check the project email/SMTP settings, then try resending. The account may already have been created.'
      : 'Your account is pending email verification.'
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown(current => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resendConfirmationEmail() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setResendState('error');
      setMessage('Enter the email address you used to register.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setResendState('error');
      setMessage('Enter a valid email address.');
      return;
    }

    setResendState('sending');
    setMessage('Sending confirmation email…');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: { emailRedirectTo: AUTH_CALLBACK_URL },
      });

      if (error) throw error;

      setResendState('sent');
      setCooldown(60);
      setEmail(cleanEmail);
      setMessage('Confirmation email sent. Check your inbox and spam folder.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : '';
      const errorStatus =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
          ? error.status
          : undefined;
      const isRateLimited =
        errorMessage.includes('rate limit') ||
        errorStatus === 429;
      const emailDeliveryFailed =
        /error sending confirmation email|could not send.*confirmation email|failed to send.*confirmation email/i.test(
          errorMessage
        );

      setResendState('error');
      if (isRateLimited || emailDeliveryFailed) setCooldown(60);
      setMessage(
        isRateLimited
          ? 'Please wait before requesting another email.'
          : emailDeliveryFailed
            ? 'Supabase could not deliver the email. The project owner must configure or repair SMTP/email delivery in Supabase Auth before resending.'
          : 'Could not send the confirmation email. Check your connection and try again.'
      );
    }
  }

  function returnToAuth(mode: 'signin' | 'signup') {
    router.replace({
      pathname: '/auth',
      params: { mode, email },
    });
  }

  async function continueAsGuest() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session && !isEmailVerified(data.session.user)) {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: 'local',
        });
        if (signOutError) throw signOutError;
      }

      router.replace('/explore');
    } catch (error) {
      Alert.alert(
        'Could not continue as guest',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }

  const resendLabel =
    resendState === 'sending'
      ? 'Sending…'
      : cooldown > 0
        ? `Resend in ${cooldown}s`
        : 'Resend confirmation email';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread-outline" size={35} color="#1A73E8" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Check your email
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {deliveryFailure
              ? 'The signup request may have created your account, but the verification message was not delivered. Once email delivery is fixed, resend the confirmation link below.'
              : 'We\u2019ve sent a verification link to your email address. Open your inbox and click the link to activate your USTP Campus Navigator account.'}
          </Text>

          <View style={[styles.emailBox, { borderColor: colors.border }]}>
            <Text style={[styles.emailLabel, { color: colors.secondaryText }]}>
              REGISTERED EMAIL
            </Text>
            <TextInput
              style={[styles.email, { color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={resendState !== 'sending'}
              accessibilityLabel="Registered email address"
            />
            <Text style={[styles.pendingLabel, { color: colors.secondaryText }]}>
              PENDING VERIFICATION
            </Text>
          </View>

          <Text
            style={[
              styles.status,
              { color: resendState === 'error' ? '#B42318' : colors.secondaryText },
            ]}
            accessibilityLiveRegion="polite"
          >
            {message}
          </Text>

          <Pressable
            style={[styles.primaryButton, (resendState === 'sending' || cooldown > 0) && styles.disabledButton]}
            onPress={() => void resendConfirmationEmail()}
            disabled={resendState === 'sending' || cooldown > 0}
            accessibilityRole="button"
          >
            {resendState === 'sending' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.primaryButtonText}>{resendLabel}</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => returnToAuth('signup')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Change email / return to sign up
            </Text>
          </Pressable>

          <Pressable
            style={styles.textButton}
            onPress={() => returnToAuth('signin')}
          >
            <Text style={styles.textButtonLabel}>Back to login</Text>
          </Pressable>

          <Pressable
            style={styles.guestButton}
            onPress={() => void continueAsGuest()}
          >
            <Ionicons name="map-outline" size={17} color="#31506F" />
            <Text style={styles.guestButtonLabel}>Continue as guest</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#EAF2FF',
    marginBottom: 20,
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  emailBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
  },
  emailLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  email: {
    padding: 0,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  pendingLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 9,
  },
  status: {
    minHeight: 38,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: { opacity: 0.6 },
  secondaryButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 11,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '700' },
  textButton: { paddingVertical: 15 },
  textButtonLabel: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '800',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  guestButtonLabel: {
    color: '#31506F',
    fontSize: 13,
    fontWeight: '800',
  },
});
