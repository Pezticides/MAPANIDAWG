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
import { createLocalProfile, signInLocalProfile } from '../lib/localProfile';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      Alert.alert('Missing information', 'Enter your email and password field to continue.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Missing information', 'Enter your full name.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await createLocalProfile(name, cleanEmail);
      } else {
        const profile = await signInLocalProfile(cleanEmail);
        if (!profile) {
          Alert.alert(
            'No local profile found',
            'Create a profile with Sign Up first. Local profiles are stored only on this device.'
          );
          return;
        }
      }
      router.replace('/map');
    } catch (error) {
      Alert.alert(
        mode === 'signup' ? 'Could not create profile' : 'Could not sign in',
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={23} color="#24364B" />
          </Pressable>

          <View style={styles.logo}>
            <Ionicons name="school" size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your profile'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Sign in to your profile on this device.' : 'Set up a local profile for your campus visits.'}
          </Text>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'signin' && styles.activeTab]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'signup' && styles.activeTab]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
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
            placeholder="Password field (demo only)"
            placeholderTextColor="#8A97A7"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={busy}
          >
            <Text style={styles.buttonText}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Profile'}
            </Text>
            {!busy && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          </Pressable>

          <View style={styles.notice}>
            <Ionicons name="phone-portrait-outline" size={17} color="#718096" />
            <Text style={styles.note}>
              Local demo only. Profiles stay on this device. The password field is not stored or verified, so this is not secure authentication.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 26, paddingBottom: 30 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F2F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  logo: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#1A73E8', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 29, fontWeight: '900', color: '#172B4D' },
  subtitle: { color: '#718096', marginTop: 8, marginBottom: 25, lineHeight: 21 },
  tabs: { flexDirection: 'row', backgroundColor: '#F1F4F8', borderRadius: 13, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: 13, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { color: '#8290A2', fontWeight: '800' },
  activeTabText: { color: '#1A73E8' },
  input: { height: 54, borderWidth: 1, borderColor: '#E1E7EF', borderRadius: 13, paddingHorizontal: 16, marginBottom: 14, color: '#172B4D', fontSize: 15 },
  button: { height: 56, backgroundColor: '#1A73E8', borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20, padding: 12, borderRadius: 12, backgroundColor: '#F4F6F9' },
  note: { flex: 1, fontSize: 11, lineHeight: 17, color: '#718096' },
});
