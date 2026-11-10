
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { campusLocations } from '../../data/campusLocations';
import { useSettings } from '../context/SettingsContext';
import { getSavedLocationIds, removeSavedLocation } from '../lib/savedLocations';

export default function SavedScreen() {
  const { colors } = useSettings();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    try {
      setSavedIds(await getSavedLocationIds());
    } catch (error) {
      console.error('Could not load saved places:', error);
      Alert.alert('Error', 'Could not load your saved locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSaved();
    }, [loadSaved])
  );

  const savedPlaces = campusLocations.filter(place =>
    savedIds.includes(String(place.id))
  );

  async function handleRemove(id: string) {
    try {
      setSavedIds(await removeSavedLocation(id));
    } catch (error) {
      console.error('Could not remove saved place:', error);
      Alert.alert('Error', 'Could not remove this saved location.');
    }
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
          <Text style={[styles.heading, { color: colors.text }]}>Saved Locations</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Your bookmarked campus places
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.secondaryText }]}>
          {savedPlaces.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Loading saved locations...
          </Text>
        ) : savedPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={36} color="#1A73E8" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No saved locations yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              Bookmark buildings in Explore or on the map and they will appear here.
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore campus</Text>
            </Pressable>
          </View>
        ) : (
          savedPlaces.map(place => (
            <View
              key={String(place.id)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
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

              <View style={styles.cardBody}>
                <Text style={[styles.placeName, { color: colors.text }]}>
                  {place.name}
                </Text>
                <Text
                  style={[styles.description, { color: colors.secondaryText }]}
                  numberOfLines={2}
                >
                  {place.description}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.mapButton}
                    onPress={() => openOnMap(String(place.id))}
                  >
                    <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
                    <Text style={styles.mapButtonText}>Open on Map</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.removeButton, { backgroundColor: colors.surface }]}
                    onPress={() => handleRemove(String(place.id))}
                  >
                    <Ionicons name="bookmark" size={17} color="#1A73E8" />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
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
  heading: { fontSize: 21, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 3 },
  count: { fontSize: 14, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 35, flexGrow: 1 },
  emptyState: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  exploreButton: {
    marginTop: 20,
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  exploreButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 17,
  },
  photo: { width: '100%', height: 165 },
  photoPlaceholder: {
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: '#6281A8', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 15 },
  placeName: { fontSize: 16, fontWeight: '900' },
  description: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 15 },
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
  removeButton: {
    flex: 1,
    height: 43,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  removeText: { color: '#1A73E8', fontSize: 12, fontWeight: '800' },
});
