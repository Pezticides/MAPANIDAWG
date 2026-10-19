
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CAMPUS_CENTER,
  campusLocations,
} from '../../data/campusLocations';

const BLUE = '#1A73E8';
const STORAGE_KEY = 'ustp_saved_locations';

const categories = ['All', 'Academic', 'Office', 'Food', 'Facility'];

// Leaflet + OpenStreetMap. No Google Maps API key required.
function createMapHtml() {
  const locationsJson = JSON.stringify(campusLocations)
    .replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #e7edf2;
    }
    .leaflet-container {
      font-family: Arial, sans-serif;
    }
    .pin {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #1A73E8;
      border: 3px solid white;
      box-shadow: 0 2px 7px #0005;
    }
    .pin.selected {
      background: #EA4335;
      width: 22px;
      height: 22px;
    }
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const initialLocations = ${locationsJson};

  const map = L.map('map', {
    zoomControl: false
  }).setView(
    [${CAMPUS_CENTER.latitude}, ${CAMPUS_CENTER.longitude}],
    17
  );

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  let tileLayer;
  let markers = [];
  let userMarker = null;

  function setBaseLayer(type) {
    if (tileLayer) map.removeLayer(tileLayer);

    if (type === 'carto') {
      tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }
      );
    } else {
      tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }
      );
    }

    tileLayer.addTo(map);
  }

  setBaseLayer('osm');

  function sendMessage(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }

  function setCampusData(locations, selectedId) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    locations.forEach(place => {
      const isSelected = String(place.id) === String(selectedId);

      const marker = L.marker(
        [place.latitude, place.longitude],
        {
          icon: L.divIcon({
            className: '',
            html: '<div class="pin ' +
              (isSelected ? 'selected' : '') + '"></div>',
            iconSize: isSelected ? [28, 28] : [24, 24],
            iconAnchor: isSelected ? [14, 14] : [12, 12]
          })
        }
      );

      marker.bindPopup(
        '<b>' + escapeHtml(place.name) + '</b><br>' +
        escapeHtml(place.category)
      );

      marker.on('click', () => {
        sendMessage({ type: 'marker', id: String(place.id) });
      });

      marker.addTo(map);
      markers.push(marker);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function focusLocation(lat, lng, zoom) {
    map.flyTo([lat, lng], zoom || 19, { duration: 0.5 });
  }

  function showUserLocation(lat, lng) {
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#4285F4',
      fillOpacity: 1
    }).addTo(map);

    userMarker.bindPopup('Your location');
    focusLocation(lat, lng, 18);
  }

  map.on('click', () => {
    sendMessage({ type: 'mapPress' });
  });

  window.setCampusData = setCampusData;
  window.focusLocation = focusLocation;
  window.showUserLocation = showUserLocation;
  window.setBaseLayer = setBaseLayer;

  setCampusData(initialLocations, null);
</script>
</body>
</html>`;
}

export default function CampusMapScreen() {
  const mapRef = useRef<WebView>(null);

  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] =
    useState<(typeof campusLocations)[number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [baseLayer, setBaseLayer] = useState<'osm' | 'carto'>('osm');

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);

  const mapHtml = useMemo(() => createMapHtml(), []);

  useEffect(() => {
    async function loadSavedLocations() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setSavedIds(parsed.map(String));
          }
        }
      } catch (error) {
        console.error('Could not load saved locations:', error);
        Alert.alert('Error', 'Could not load your saved locations.');
      } finally {
        setSavedLoaded(true);
      }
    }

    loadSavedLocations();
  }, []);

  const filtered = useMemo(() => {
    return campusLocations.filter((place) => {
      const matchesCategory =
        category === 'All' || place.category === category;

      const matchesSearch = place.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const matchesSaved =
        !showSavedOnly || savedIds.includes(String(place.id));

      return matchesCategory && matchesSearch && matchesSaved;
    });
  }, [query, category, showSavedOnly, savedIds]);

  // Update markers without reloading the map.
  useEffect(() => {
    if (!mapReady) return;

    const data = JSON.stringify(filtered).replace(/</g, '\\u003c');
    const selectedId = JSON.stringify(
      selected ? String(selected.id) : null
    );

    mapRef.current?.injectJavaScript(
      `window.setCampusData(${data}, ${selectedId}); true;`
    );
  }, [filtered, selected, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    mapRef.current?.injectJavaScript(
      `window.setBaseLayer(${JSON.stringify(baseLayer)}); true;`
    );
  }, [baseLayer, mapReady]);

  async function toggleSaved(placeId: string | number) {
    if (!savedLoaded) {
      Alert.alert('Please wait', 'Saved locations are still loading.');
      return;
    }

    const id = String(placeId);
    const previous = savedIds;

    const updated = previous.includes(id)
      ? previous.filter(item => item !== id)
      : [...previous, id];

    setSavedIds(updated);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      setSavedIds(previous);
      console.error('Could not save location:', error);
      Alert.alert('Save failed', 'Could not save this location.');
    }
  }

  function focusLocation(place: (typeof campusLocations)[number]) {
    setSelected(place);
    setQuery('');
    Keyboard.dismiss();

    mapRef.current?.injectJavaScript(
      `window.focusLocation(${place.latitude}, ${place.longitude}, 19); true;`
    );
  }

  async function locateMe() {
    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location permission',
          'Allow location access to find your position.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});

      mapRef.current?.injectJavaScript(
        `window.showUserLocation(
          ${position.coords.latitude},
          ${position.coords.longitude}
        ); true;`
      );
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location unavailable',
        'Check your device location settings and try again.'
      );
    }
  }

  function openDirections() {
    if (!selected) return;

    const destination = `${selected.latitude},${selected.longitude}`;
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open directions.');
    });
  }

  function openSavedLocations() {
    setShowSavedOnly(true);
    setDrawerOpen(false);
    setSelected(null);
    setQuery('');
    setCategory('All');
  }

  function showAllLocations() {
    setShowSavedOnly(false);
    setDrawerOpen(false);
    setSelected(null);
    setQuery('');
    setCategory('All');
  }

  function handleMapMessage(event: { nativeEvent: { data: string } }) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'marker') {
        const place = campusLocations.find(
          item => String(item.id) === String(message.id)
        );

        if (place) setSelected(place);
      }

      if (message.type === 'mapPress') {
        setSelected(null);
      }
    } catch (error) {
      console.error('Map message error:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <WebView
          ref={mapRef}
          source={{ html: mapHtml }}
          style={styles.webMap}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setMapReady(true)}
          onMessage={handleMapMessage}
          mixedContentMode="compatibility"
          onError={() => {
            Alert.alert(
              'Map loading error',
              'Check your internet connection and reload the app.'
            );
          }}
        />

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setDrawerOpen(true)}
          >
            <Ionicons name="menu" size={25} color="#263746" />
          </Pressable>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#68778D" />
            <TextInput
              style={styles.searchInput}
              placeholder={
                showSavedOnly
                  ? 'Search saved locations'
                  : 'Search campus locations'
              }
              placeholderTextColor="#8793A1"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />

            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#8793A1"
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* SEARCH RESULTS */}
        {query.length > 0 && (
          <View style={styles.results}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map(place => (
                <Pressable
                  key={String(place.id)}
                  style={styles.resultRow}
                  onPress={() => focusLocation(place)}
                >
                  <Ionicons name="location" size={21} color={BLUE} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultCategory}>
                      {place.category}
                    </Text>
                  </View>
                  {savedIds.includes(String(place.id)) && (
                    <Ionicons name="bookmark" size={18} color={BLUE} />
                  )}
                </Pressable>
              ))}

              {filtered.length === 0 && (
                <Text style={styles.empty}>
                  No locations found.
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* MAP CONTROLS */}
        <View style={styles.mapControls}>
          <Pressable style={styles.iconButton} onPress={locateMe}>
            <Ionicons name="locate" size={23} color={BLUE} />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() =>
              setBaseLayer(current => current === 'osm' ? 'carto' : 'osm')
            }
          >
            <Ionicons name="layers-outline" size={23} color="#263746" />
          </Pressable>
        </View>

        {/* CATEGORY FILTERS */}
        {!showSavedOnly && (
          <View style={styles.categories}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categories.map(item => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.chip,
                    category === item && styles.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item && styles.activeChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SAVED LOCATIONS */}
        {showSavedOnly && (
          <View style={styles.savedBanner}>
            <Ionicons name="bookmark" size={18} color={BLUE} />
            <Text style={styles.savedBannerText}>
              Saved Locations ({filtered.length})
            </Text>
            <Pressable onPress={showAllLocations}>
              <Text style={styles.showAllText}>Show All</Text>
            </Pressable>
          </View>
        )}

        {/* SELECTED LOCATION */}
        {selected && (
          <View style={styles.placeCard}>
            <View style={styles.handle} />

            <View style={styles.placeHeader}>
              <View style={styles.placeIcon}>
                <Ionicons name="location" size={24} color={BLUE} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.placeName}>{selected.name}</Text>
                <Text style={styles.placeCategory}>
                  {selected.category} · USTP CDO
                </Text>
              </View>

              <Pressable onPress={() => setSelected(null)}>
                <Ionicons name="close" size={23} color="#718096" />
              </Pressable>
            </View>

            <Text style={styles.description}>
              {selected.description}
            </Text>

            <View style={styles.actions}>
              <Pressable
                style={styles.directionsButton}
                onPress={openDirections}
              >
                <Ionicons name="navigate" size={19} color="#FFFFFF" />
                <Text style={styles.directionsText}>Directions</Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={() => toggleSaved(selected.id)}
              >
                <Ionicons
                  name={
                    savedIds.includes(String(selected.id))
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={19}
                  color={BLUE}
                />
                <Text style={styles.saveText}>
                  {savedIds.includes(String(selected.id)) ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SIDE DRAWER */}
        {drawerOpen && (
          <View style={styles.drawerOverlay}>
            <Pressable
              style={styles.scrim}
              onPress={() => setDrawerOpen(false)}
            />

            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerLogo}>
                  <Ionicons name="school" size={27} color="#FFFFFF" />
                </View>
                <Text style={styles.drawerTitle}>USTP CDO</Text>
                <Text style={styles.drawerSubtitle}>CAMPUS NAVIGATOR</Text>
              </View>

              <DrawerItem
                icon="map-outline"
                label="Campus Map"
                onPress={showAllLocations}
              />

              <DrawerItem
                icon="business-outline"
                label="Explore Buildings"
                onPress={() => {
                  setShowSavedOnly(false);
                  setCategory('Academic');
                  setQuery('');
                  setSelected(null);
                  setDrawerOpen(false);
                }}
              />

              <DrawerItem
                icon="grid-outline"
                label="Categories"
                onPress={() => {
                  setShowSavedOnly(false);
                  setCategory('All');
                  setQuery('');
                  setSelected(null);
                  setDrawerOpen(false);
                }}
              />

              <DrawerItem
                icon="bookmark-outline"
                label={`Saved Locations (${savedIds.length})`}
                onPress={openSavedLocations}
              />

              <DrawerItem
                icon="information-circle-outline"
                label="About USTP"
                onPress={() => {
                  setDrawerOpen(false);
                  Alert.alert(
                    'About USTP',
                    'USTP CDO Campus Navigator helps students and visitors explore campus locations, find buildings, and get directions.'
                  );
                }}
              />

              <DrawerItem
                icon="settings-outline"
                label="Settings"
                onPress={() => {
                  setDrawerOpen(false);
                  Alert.alert(
                    'Settings',
                    'More settings will be added in a future update.'
                  );
                }}
              />

              <View style={styles.divider} />

              <DrawerItem
                icon="log-out-outline"
                label="Sign Out"
                onPress={() => {
                  setDrawerOpen(false);
                  router.replace('/');
                }}
              />

              <Text style={styles.version}>
                Version 1.0 · Student project
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.drawerItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#526174" />
      <Text style={styles.drawerLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#E7EDF2',
  },
  webMap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E7EDF2',
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#263746',
  },
  results: {
    position: 'absolute',
    top: 65,
    left: 69,
    right: 12,
    maxHeight: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263746',
  },
  resultCategory: {
    fontSize: 11,
    color: '#8491A1',
    marginTop: 3,
  },
  empty: {
    padding: 16,
    color: '#718096',
  },
  mapControls: {
    position: 'absolute',
    right: 14,
    top: 82,
    gap: 10,
  },
  categories: {
    position: 'absolute',
    top: 145,
    left: 0,
    right: 0,
  },
  categoryList: {
    gap: 8,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  activeChip: {
    backgroundColor: BLUE,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#435267',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  savedBanner: {
    position: 'absolute',
    top: 145,
    left: 12,
    right: 12,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    elevation: 4,
  },
  savedBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#263746',
  },
  showAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },
  placeCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#D9E0E7',
    marginBottom: 14,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D2D40',
  },
  placeCategory: {
    fontSize: 11,
    color: '#7B8999',
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: '#68778D',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  directionsButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveButton: {
    paddingHorizontal: 18,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#EAF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveText: {
    color: BLUE,
    fontWeight: '800',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    zIndex: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12,25,42,0.35)',
  },
  drawer: {
    width: '82%',
    maxWidth: 330,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingHorizontal: 18,
    elevation: 12,
  },
  drawerHeader: {
    backgroundColor: '#EAF2FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 17,
  },
  drawerLogo: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#172B4D',
  },
  drawerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#718096',
    marginTop: 4,
  },
  drawerItem: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 12,
  },
  drawerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#435267',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF0F4',
    marginVertical: 10,
  },
  version: {
    position: 'absolute',
    bottom: 22,
    left: 30,
    fontSize: 11,
    color: '#A0AAB6',
  },
});
