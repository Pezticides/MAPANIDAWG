import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { campusLocations } from '../../data/campusLocations';
import { getCurrentProfile, getSavedLocationsKey, LocalProfile, updateLocalProfileName } from '../lib/localProfile';

const BLUE = '#1A73E8';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'U';
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [name, setName] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const current = await getCurrentProfile();
      if (!current) {
        router.replace('/auth');
        return;
      }
      setProfile(current);
      setName(current.name);
      const savedRaw = await AsyncStorage.getItem(getSavedLocationsKey(current.email));
      if (savedRaw) {
        const parsed: unknown = JSON.parse(savedRaw);
        setSavedIds(Array.isArray(parsed) ? parsed.map(String) : []);
      } else {
        setSavedIds([]);
      }
    } catch {
      Alert.alert('Could not load profile', 'Please go back and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  async function saveProfile() {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a name before saving.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateLocalProfileName(profile.email, name);
      setProfile(updated);
      setName(updated.name);
      Alert.alert('Profile updated', 'Your name has been saved on this device.');
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function removeSavedLocation(id: string) {
    if (!profile) return;
    const updated = savedIds.filter(savedId => savedId !== id);
    setSavedIds(updated);
    try {
      await AsyncStorage.setItem(getSavedLocationsKey(profile.email), JSON.stringify(updated));
    } catch {
      setSavedIds(savedIds);
      Alert.alert('Could not update saved places', 'Please try again.');
    }
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}><ActivityIndicator size="large" color={BLUE} /></View>
      </SafeAreaView>
    );
  }

  const savedPlaces = campusLocations.filter(place => savedIds.includes(String(place.id)));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#24364B" />
        </Pressable>
        <Text style={styles.topTitle}>My Profile</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileHero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(profile.name)}</Text></View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <View style={styles.localBadge}><Ionicons name="phone-portrait-outline" size={14} color="#54708D" /><Text style={styles.localBadgeText}>Stored on this device</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile information</Text>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#94A0AE"
            autoCapitalize="words"
            style={styles.input}
            returnKeyType="done"
          />
          <Text style={styles.label}>Email address</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{profile.email}</Text>
            <Ionicons name="lock-closed-outline" size={16} color="#9AA6B2" />
          </View>
          <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
            <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Saved locations</Text>
            <View style={styles.countBadge}><Text style={styles.countText}>{savedPlaces.length}</Text></View>
          </View>
          {savedPlaces.length === 0 ? (
            <View style={styles.emptySaved}>
              <Ionicons name="bookmark-outline" size={24} color="#9AA6B2" />
              <Text style={styles.emptyTitle}>No saved places yet</Text>
              <Text style={styles.emptyDescription}>Save a campus location from its map card and it will appear here.</Text>
              <Pressable style={styles.outlineButton} onPress={() => router.replace('/map')}>
                <Text style={styles.outlineButtonText}>Open Campus Map</Text>
              </Pressable>
            </View>
          ) : savedPlaces.map(place => (
            <View key={place.id} style={styles.savedRow}>
              <View style={styles.savedIcon}><Ionicons name="location-outline" size={20} color={BLUE} /></View>
              <View style={styles.savedInfo}>
                <Text style={styles.savedName}>{place.name}</Text>
                <Text style={styles.savedCategory}>{place.category}</Text>
              </View>
              <Pressable onPress={() => removeSavedLocation(String(place.id))} accessibilityLabel={`Remove ${place.name} from saved places`} style={styles.removeButton}>
                <Ionicons name="bookmark" size={19} color={BLUE} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>This profile is stored locally on this device. It is not synced to an online account.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, backgroundColor: '#FFFFFF' },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F4F8', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#172B4D', fontSize: 17, fontWeight: '900' },
  topSpacer: { width: 38 },
  content: { padding: 17, paddingBottom: 30 },
  profileHero: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: BLUE, fontSize: 27, fontWeight: '900' },
  profileName: { fontSize: 21, fontWeight: '900', color: '#172B4D' },
  profileEmail: { marginTop: 5, color: '#718096', fontSize: 13 },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F5FA', marginTop: 13 },
  localBadgeText: { color: '#54708D', fontSize: 11, fontWeight: '700' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#172B4D', marginBottom: 15 },
  label: { color: '#637287', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 49, borderWidth: 1, borderColor: '#E1E7EF', borderRadius: 12, paddingHorizontal: 13, color: '#172B4D', fontSize: 14, marginBottom: 14, justifyContent: 'center' },
  readOnlyInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F6F8FA' },
  readOnlyText: { color: '#7C8897', fontSize: 14 },
  saveButton: { minHeight: 48, borderRadius: 13, backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.65 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBadge: { minWidth: 27, height: 27, paddingHorizontal: 7, borderRadius: 14, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  countText: { color: BLUE, fontWeight: '800', fontSize: 12 },
  emptySaved: { alignItems: 'center', paddingVertical: 16 },
  emptyTitle: { color: '#263746', fontWeight: '800', fontSize: 14, marginTop: 9 },
  emptyDescription: { color: '#7C8897', textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 14 },
  outlineButton: { borderWidth: 1, borderColor: '#C9DAF5', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 },
  outlineButtonText: { color: BLUE, fontSize: 12, fontWeight: '800' },
  savedRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#F0F2F5', paddingVertical: 8 },
  savedIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  savedInfo: { flex: 1 },
  savedName: { color: '#263746', fontWeight: '700', fontSize: 13 },
  savedCategory: { color: '#8491A1', fontSize: 11, marginTop: 4 },
  removeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { color: '#8995A3', fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 8, marginTop: 1 },
});
