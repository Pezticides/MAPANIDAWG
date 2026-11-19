import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#1A73E8';

export default function WelcomeScreen() {
  return (
    <ImageBackground
      source={require('../../assets/images/USTPMAP.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View style={styles.brandMark}>
              <Ionicons name="school" size={23} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>USTP CDO</Text>
              <Text style={styles.brandCaption}>CAMPUS NAVIGATOR</Text>
            </View>
            <View style={styles.locationPill}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>CAGAYAN DE ORO</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="navigate" size={14} color="#D9E9FF" />
              <Text style={styles.heroBadgeText}>YOUR CAMPUS, MADE SIMPLE</Text>
            </View>
            <Text style={styles.heroTitle}>
              Your campus,{'\n'}within reach.
            </Text>
            <Text style={styles.heroSubtitle}>
              Find the places that make USTP feel like yours.
            </Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.cardEyebrow}>EXPLORE USTP</Text>
            <Text style={styles.cardTitle}>Get where you need to go.</Text>
            <Text style={styles.description}>
              Discover campus buildings and facilities, and save the places
              you visit most.
            </Text>

            <View style={styles.featureRow}>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="compass-outline" size={18} color={BLUE} />
                </View>
                <Text style={styles.featureText}>Find places</Text>
              </View>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="bookmark-outline" size={18} color={BLUE} />
                </View>
                <Text style={styles.featureText}>Save favorites</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/auth')}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.guestButton,
                pressed && styles.guestButtonPressed,
              ]}
              onPress={() => router.replace('/explore')}
            >
              <Ionicons name="map-outline" size={18} color="#31506F" />
              <Text style={styles.guestButtonText}>Explore as guest</Text>
            </Pressable>

            <Text style={styles.guestNote}>
              No account needed to explore the campus.
            </Text>
          </View>

          <Text style={styles.footer}>MADE FOR THE USTP COMMUNITY</Text>
        </ScrollView>
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
    backgroundColor: 'rgba(7, 24, 47, 0.62)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  topBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  brandCaption: {
    color: '#D5E4F6',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#84D7A6',
    marginRight: 6,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  hero: {
    flexGrow: 1,
    minHeight: 245,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 24,
    paddingBottom: 30,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroBadgeText: {
    color: '#E4F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 7,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginTop: 17,
  },
  heroSubtitle: {
    color: '#E3ECF7',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 18,
    shadowColor: '#07182F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  cardEyebrow: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: '#172B4D',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 7,
  },
  description: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  featureRow: {
    flexDirection: 'row',
    marginTop: 17,
    marginBottom: 19,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#ECF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  featureText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 54,
    backgroundColor: BLUE,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  guestButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    marginTop: 10,
    gap: 9,
  },
  guestButtonText: {
    color: '#31506F',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  guestButtonPressed: {
    backgroundColor: '#F3F7FC',
  },
  guestNote: {
    color: '#8492A6',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginTop: 16,
  },
});
