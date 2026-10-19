
import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
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
          style={styles.button}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    backgroundColor: '#EAF2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 28,
    color: '#52708E',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 11,
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 19,
    fontWeight: '900',
    color: '#172B4D',
  },
  subtitle: {
    marginTop: 4,
    color: '#718096',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#172B4D',
    marginTop: 28,
    lineHeight: 42,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#68778D',
    marginTop: 14,
    marginBottom: 28,
  },
  button: {
    height: 56,
    backgroundColor: '#1A73E8',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
