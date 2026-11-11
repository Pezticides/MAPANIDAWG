
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
    <ImageBackground
      source={require('../../assets/images/USTPMAP.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="school" size={60} color="#FFFFFF" />
          </View>

          <Text style={styles.eyebrow}>
            YOUR CAMPUS, MADE SIMPLE
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.brand}>USTP CDO</Text>

          <Text style={styles.subtitle}>
            CAMPUS NAVIGATOR
          </Text>

          <Text style={styles.title}>
            Find your way around campus.
          </Text>

          <Text style={styles.description}>
            Discover buildings, locate campus facilities,
            and find your way around USTP Cagayan de Oro.
          </Text>

          {/* Account registration and sign-in */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.primaryButtonText}>
              GET STARTED
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          {/* Guest access - no account required */}
          <Pressable
            style={({ pressed }) => [
              styles.guestButton,
              pressed && styles.guestButtonPressed,
            ]}
            onPress={() => router.replace('/map')}
          >
            <Ionicons
              name="map-outline"
              size={19}
              color="#FFFFFF"
            />
            <Text style={styles.guestButtonText}>
              EXPLORE AS GUEST
            </Text>
          </Pressable>

          <Text style={styles.guestNote}>
            No account required to explore the campus.
          </Text>

          <Text style={styles.footer}>
            UNIVERSITY CAMPUS NAVIGATION
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#10233F',
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 20, 42, 0.72)',
  },

  container: {
    flex: 1,
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 125,
    height: 125,
    borderRadius: 36,
    backgroundColor: 'rgba(26, 115, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyebrow: {
    marginTop: 25,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 3,
    fontSize: 11,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 30,
  },

  brand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 5,
    color: '#B8D7FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 25,
    lineHeight: 44,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#E0E8F2',
    marginTop: 14,
    marginBottom: 25,
  },

  primaryButton: {
    height: 58,
    backgroundColor: '#1A73E8',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
  },

  guestButton: {
    height: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  guestButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  guestNote: {
    color: '#C5D3E4',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },

  footer: {
    color: '#B8C7D9',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 22,
  },
});
