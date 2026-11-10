
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
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="school" size={60} color="#fff" />
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

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.buttonText}>
              GET STARTED
            </Text>

            <Ionicons
              name="arrow-forward"
              size={20}
              color="#fff"
            />
          </Pressable>

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
    backgroundColor: 'rgba(5, 20, 42, 0.68)',
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
    paddingBottom: 35,
    justifyContent: 'center',
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
    marginBottom: 28,
  },

  button: {
    height: 58,
    backgroundColor: '#1A73E8',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
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
