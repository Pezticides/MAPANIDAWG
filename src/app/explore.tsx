
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { campusLocations } from '../../data/campusLocations';
import { useSettings } from '../context/SettingsContext';
import { getSavedLocationIds, toggleSavedLocation } from '../lib/savedLocations';

export default function ExploreScreen() {
  const { colors } = useSettings();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    try {
      setSavedIds(await getSavedLocationIds());
    } catch (error) {
      console.error('Could not load saved places:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSaved();
    }, [loadSaved])
  );

  async function handleSave(id: string) {
    try {
      setSavedIds(await toggleSavedLocation(id));
    } catch (error) {
      console.error('Could not update saved place:', error);
    }
  }

  function openDetails(id: string) {
    router.push({
      pathname: '/building/[id]',
      params: { id },
    });
  }

  function openOnMap(id: string) {
    router.push({
      pathname: '/map',
      params: { locationId: id },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Explore Buildings
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Discover places around USTP CDO
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/saved')}
          style={styles.headerButton}
        >
          <Ionicons name="bookmark-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.introCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="school-outline" size={27} color="#1A73E8" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Your campus, explored
            </Text>
            <Text style={[styles.introText, { color: colors.secondaryText }]}>
              Browse campus buildings and open any location on the map.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Campus locations
          </Text>
          <Text style={[styles.count, { color: colors.secondaryText }]}>
            {campusLocations.length} places
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#1A73E8" style={{ marginTop: 30 }} />
        ) : (
          campusLocations.map((place) => {
            const isSaved = savedIds.includes(String(place.id));

            return (
              <View
                key={String(place.id)}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Pressable onPress={() => openDetails(String(place.id))}>
                  {place.image ? (
                    <Image
                      source={place.image}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.photo, styles.photoPlaceholder]}>
                      <Text>No Image Available</Text>
                    </View>
                  )}
                </Pressable>

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.placeName, { color: colors.text }]}>
                      {place.name}
                    </Text>

                    <Pressable
                      onPress={() => void handleSave(String(place.id))}
                      hitSlop={10}
                      style={styles.bookmarkButton}
                    >
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={isSaved ? '#1A73E8' : colors.secondaryText}
                      />
                    </Pressable>
                  </View>

                  <Text
                    style={[styles.description, { color: colors.secondaryText }]}
                    numberOfLines={3}
                  >
                    {place.description}
                  </Text>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.detailsButton}
                      onPress={() => openDetails(String(place.id))}
                    >
                      <Text style={styles.detailsButtonText}>View details</Text>
                    </Pressable>

                    <Pressable
                      style={styles.mapButton}
                      onPress={() => openOnMap(String(place.id))}
                    >
                      <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
                      <Text style={styles.mapButtonText}>View on Map</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingVertical: 13,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontSize: 21, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 3 },
  content: { padding: 16, paddingBottom: 35 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    borderRadius: 18,
    marginBottom: 23,
  },
  introTitle: { fontSize: 15, fontWeight: '800' },
  introText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  count: { fontSize: 12 },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 17,
  },
  photo: { width: '100%', height: 175 },
  photoPlaceholder: {
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    color: '#6281A8',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: { padding: 15 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  placeName: { flex: 1, fontSize: 16, fontWeight: '900' },
  bookmarkButton: { padding: 4 },
  description: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  detailsButton: {
    flex: 1,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: { color: '#1A73E8', fontSize: 12, fontWeight: '800' },
  mapButton: {
    flex: 1,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mapButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
