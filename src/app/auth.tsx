
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleContinue() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter your email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Error', 'Enter your full name.');
      return;
    }

    // Demo only: connect a real authentication service later.
    router.replace('/map');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.back}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={23} color="#24364B" />
      </Pressable>

      <View style={styles.logo}>
        <Ionicons name="school" size={30} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>
        {mode === 'signin'
          ? 'Welcome back'
          : 'Create your account'}
      </Text>

      <Text style={styles.subtitle}>
        Explore USTP with your campus navigator.
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mode === 'signin' && styles.activeTab]}
          onPress={() => setMode('signin')}
        >
          <Text style={styles.tabText}>Sign In</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, mode === 'signup' && styles.activeTab]}
          onPress={() => setMode('signup')}
        >
          <Text style={styles.tabText}>Sign Up</Text>
        </Pressable>
      </View>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={styles.button}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.note}>
        Authentication is currently in demonstration mode.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 26,
    backgroundColor: '#FFFFFF',
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
  },
  tabText: {
    color: '#1A73E8',
    fontWeight: '800',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    borderRadius: 13,
    paddingHorizontal: 16,
    marginBottom: 14,
    color: '#172B4D',
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
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8A97A7',
    marginTop: 20,
  },
});
