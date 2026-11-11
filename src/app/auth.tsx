
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Supabase client
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
            // The database signup trigger uses this metadata
            // to populate the user's profile.
            data: {
              full_name: cleanName,
            },
          },
        });

        if (error) throw error;

        // With email confirmation enabled, Supabase normally
        // returns no active session until the user verifies.
        if (!data.session) {
          Alert.alert(
            'Verify your email',
            'Your account has been created. Check your inbox for the verification email, then return here and sign in.'
          );

          setMode('signin');
          setPassword('');
          return;
        }

        // If email confirmation is disabled, a session may
        // be returned immediately.
        Alert.alert('Account created', 'You are now signed in.');
        router.replace('/map');
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

        router.replace('/map');
      }
    } catch (error) {
      Alert.alert(
        mode === 'signup' ? 'Registration failed' : 'Sign-in failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
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
