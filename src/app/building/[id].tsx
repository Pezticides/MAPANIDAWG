
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { campusLocations } from '../../../data/campusLocations';
import { useSettings } from '../../context/SettingsContext';

export default function BuildingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useSettings();

  const place = campusLocations.find(item => String(item.id) === String(id));

  if (!place) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.secondaryText} />
          <Text style={{ color: colors.text, fontWeight: '800', marginTop: 12 }}>
            Location not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.imageContainer}>
          {place.image ? (
            <Image
              source={place.image}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.placeholder]}>
              <Text>No Image Available</Text>
            </View>
          )}

          <Pressable style={styles.backOverlay} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.text }]}>{place.name}</Text>
          <Text style={[styles.campus, { color: colors.secondaryText }]}>
            USTP Cagayan de Oro Campus
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#1A73E8" />
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                Campus location
              </Text>
            </View>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {place.description}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About this place
            </Text>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {place.description}
            </Text>
          </View>

          <Pressable
            style={styles.mapButton}
            onPress={() =>
              router.push({
                pathname: '/map',
                params: { locationId: String(place.id) },
              })
            }
          >
            <Ionicons name="navigate" size={19} color="#FFFFFF" />
            <Text style={styles.mapButtonText}>Navigate to this location</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  imageContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 260 },
  placeholder: {
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: { color: '#6281A8', fontSize: 12, fontWeight: '700' },
  backOverlay: {
    position: 'absolute',
    top: 15,
    left: 16,
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#172B4D99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 18 },
  name: { fontSize: 24, fontWeight: '900' },
  campus: { fontSize: 13, marginTop: 6 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 17,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoLabel: { fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '900' },
  description: { fontSize: 13, lineHeight: 21, marginTop: 10 },
  mapButton: {
    height: 51,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 20,
  },
  mapButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  backButton: { padding: 17 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
