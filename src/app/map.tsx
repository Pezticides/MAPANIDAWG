import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Keyboard,
  PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getWalkingRoute,
  type WalkingRoute,
} from '../lib/walkingDirections';

import * as Speech from 'expo-speech';

import {
  CAMPUS_CENTER,
  campusLocations,
} from '../../data/campusLocations';

import {
  getCurrentProfile,
  getSavedLocationsKey,
  LocalProfile,
  signOutLocalProfile,
} from '../lib/localProfile';

const BLUE = '#1A73E8';
const LEGACY_STORAGE_KEY = 'ustp_saved_locations';

  type Coordinates = {
    latitude: number;
    longitude: number;
  };

  function calculateDistanceMeters(
    a: Coordinates,
    b: Coordinates
  ): number {
    const earthRadius = 6371000;

    const toRadians = (value: number) =>
      (value * Math.PI) / 180;

    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const deltaLat = toRadians(b.latitude - a.latitude);
    const deltaLon = toRadians(b.longitude - a.longitude);

    const value =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;

    return earthRadius *
      2 *
      Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function findNearestRoutePoint(
    position: Coordinates,
    route: WalkingRoute
  ) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    route.coordinates.forEach((point, index) => {
      const distance = calculateDistanceMeters(
        position,
        point
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return {
      index: nearestIndex,
      distance: nearestDistance,
    };
  }

  function calculateRemainingDistance(
    route: WalkingRoute,
    startIndex: number
  ): number {
    let total = 0;

    for (
      let index = startIndex;
      index < route.coordinates.length - 1;
      index++
    ) {
      total += calculateDistanceMeters(
        route.coordinates[index],
        route.coordinates[index + 1]
      );
    }

    return total;
  }

  function formatDistance(distance: number): string {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`;
    }

    return `${Math.round(distance)} m`;
  }

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
  let walkingRouteLayer = null;

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

  function updateUserLocation(lat, lng, follow) {
    const position = [lat, lng];

    if (!userMarker) {
      userMarker = L.circleMarker(position, {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#4285F4',
        fillOpacity: 1
      }).addTo(map);

      userMarker.bindPopup('Your location');
    } else {
      userMarker.setLatLng(position);
    }

    if (follow) {
      map.panTo(position, {
        animate: true,
        duration: 0.3
      });
    }
  }

  function drawWalkingRoute(coordinates) {
    if (walkingRouteLayer) {
      map.removeLayer(walkingRouteLayer);
      walkingRouteLayer = null;
    }

    if (!coordinates || coordinates.length < 2) return;

    const points = coordinates.map(point => [
      point.latitude,
      point.longitude
    ]);

    walkingRouteLayer = L.polyline(points, {
      color: '#1A73E8',
      weight: 7,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    map.fitBounds(walkingRouteLayer.getBounds(), {
      padding: [45, 45],
      maxZoom: 19
    });
  }

  function clearWalkingRoute() {
    if (!walkingRouteLayer) return;

    map.removeLayer(walkingRouteLayer);
    walkingRouteLayer = null;
  }

  map.on('click', () => {
    sendMessage({ type: 'mapPress' });
  });

  window.setCampusData = setCampusData;
  window.focusLocation = focusLocation;
  window.showUserLocation = showUserLocation;
  window.setBaseLayer = setBaseLayer;
  window.updateUserLocation = updateUserLocation;
  window.drawWalkingRoute = drawWalkingRoute;
  window.clearWalkingRoute = clearWalkingRoute;

  setCampusData(initialLocations, null);
</script>
</body>
</html>`;
}

export default function CampusMapScreen() {
  const mapRef = useRef<WebView<unknown>>(null);


  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] =
    useState<(typeof campusLocations)[number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [baseLayer, setBaseLayer] = useState<'osm' | 'carto'>('osm');

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<LocalProfile | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [walkingRoute, setWalkingRoute] =
    useState<WalkingRoute | null>(null);

  const [routeLoading, setRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const [remainingDistance, setRemainingDistance] = useState(0);

  const [offRoute, setOffRoute] = useState(false);

  // The place sheet opens in its compact State 1 layout.
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dy < -25) {
            setSheetExpanded(true);
          } else if (gestureState.dy > 25) {
            // Collapse only. A downward swipe must never dismiss the sheet.
            setSheetExpanded(false);
          }
        },
      }),
    []
  );

  const locationSubscription =
    useRef<Location.LocationSubscription | null>(null);

  const activeStepRef = useRef(0);

  const offRouteCountRef = useRef(0);
  const rerouteInProgressRef = useRef(false);
  const lastRerouteAtRef = useRef(0);

  const mapHtml = useMemo(() => createMapHtml(), []);

  useEffect(() => {
    setSheetExpanded(false);
  }, [selected?.id]);

  const rerouteFromCurrentLocation = useCallback(
    async (currentPosition: Coordinates) => {
      if (rerouteInProgressRef.current) return;

      const now = Date.now();

      if (now - lastRerouteAtRef.current < 15000) {
        return;
      }

      if (!selected) return;

      rerouteInProgressRef.current = true;
      lastRerouteAtRef.current = now;
      setIsRerouting(true);

      try {
        Speech.stop();

        Speech.speak(
          'You are off route. Recalculating your walking route.',
          { language: 'en-US', rate: 0.95 }
        );

        const destination: Coordinates = {
          latitude: selected.latitude,
          longitude: selected.longitude,
        };

        const newRoute = await getWalkingRoute(
          currentPosition,
          destination
        );

        setWalkingRoute(newRoute);

        activeStepRef.current = 0;
        setActiveStepIndex(0);
        setRemainingDistance(newRoute.distance);

        offRouteCountRef.current = 0;
        setOffRoute(false);

        const firstInstruction =
          newRoute.steps[0]?.instruction ??
          'Follow the new blue route.';

        Speech.stop().then(() => {
          Speech.speak(
            `A new route is ready. ${firstInstruction}`,
            {
              language: 'en-US',
              rate: 0.95,
              pitch: 1.0,
            }
          );
        });
      } catch (error) {
        console.error('Automatic rerouting failed:', error);

        Speech.stop().then(() => {
          Speech.speak(
            'I could not calculate a new route. Please try again.',
            { language: 'en-US' }
          );
        });
      } finally {
        rerouteInProgressRef.current = false;
        setIsRerouting(false);
      }
    },
    [selected]
  );

  useEffect(() => {
    if (!isNavigating || !walkingRoute || !selected) {
      return;
    }

    const route = walkingRoute;
    const destinationPlace = selected;

    let cancelled = false;

    async function startGpsTracking() {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location permission required',
          'GPS permission is needed for walking navigation.'
        );

        setIsNavigating(false);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1500,
          distanceInterval: 3,
        },
        position => {
          const currentPosition: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Update the user's location marker.
          mapRef.current?.injectJavaScript(
            `window.updateUserLocation(
              ${currentPosition.latitude},
              ${currentPosition.longitude},
              true
            ); true;`
          );

          // Ignore inaccurate GPS readings for navigation decisions.
          const gpsAccuracy = position.coords.accuracy ?? 999;

          if (gpsAccuracy > 40) {
            return;
          }

          // Find the closest point on the current route.
          const nearest = findNearestRoutePoint(
            currentPosition,
            route
          );

          // Update remaining distance.
          const remaining = calculateRemainingDistance(
            route,
            nearest.index
          );

          setRemainingDistance(remaining);

          // Check if the user has reached the destination.
          const destination: Coordinates = {
            latitude: destinationPlace.latitude,
            longitude: destinationPlace.longitude,
          };

          const destinationDistance = calculateDistanceMeters(
            currentPosition,
            destination
          );

          if (destinationDistance <= 15) {
            locationSubscription.current?.remove();
            locationSubscription.current = null;

            setIsNavigating(false);
            setOffRoute(false);

            Speech.stop().then(() => {
              Speech.speak(
                `You have arrived at ${destinationPlace.name}.`,
                { language: 'en-US' }
              );
            });

            return;
          }

          // Use GPS accuracy to adjust the off-route threshold.
          const offRouteThreshold = Math.max(
            35,
            gpsAccuracy * 1.5
          );

          // Count consecutive off-route readings.
          if (nearest.distance > offRouteThreshold) {
            offRouteCountRef.current += 1;
          } else {
            offRouteCountRef.current = 0;
            setOffRoute(false);
          }

          // Three consecutive readings trigger automatic rerouting.
          if (offRouteCountRef.current >= 3) {
            setOffRoute(true);
            void rerouteFromCurrentLocation(currentPosition);
            return;
          }

          let nextStepIndex = activeStepRef.current;

          while (nextStepIndex < route.steps.length - 1) {
            const currentStep = route.steps[nextStepIndex];
            const stepEndIndex = currentStep.wayPoints[1];

            if (
              stepEndIndex > 0 &&
              nearest.index >= stepEndIndex - 2
            ) {
              nextStepIndex++;
            } else {
              break;
            }
          }

          if (nextStepIndex !== activeStepRef.current) {
            activeStepRef.current = nextStepIndex;
            setActiveStepIndex(nextStepIndex);

            const nextInstruction =
              route.steps[nextStepIndex]?.instruction;

            if (nextInstruction) {
              Speech.stop().then(() => {
                Speech.speak(nextInstruction, {
                  language: 'en-US',
                  rate: 0.95,
                  pitch: 1.0,
                });
              });
            }
          }
        }
      );

      if (cancelled) {
        subscription.remove();
        return;
      }

      locationSubscription.current = subscription;
    }

    startGpsTracking().catch(error => {
      console.error('GPS tracking error:', error);

      Alert.alert(
        'Navigation error',
        'Could not start GPS tracking.'
      );

      setIsNavigating(false);
    });

    return () => {
      cancelled = true;

      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, [
    isNavigating,
    walkingRoute,
    selected,
    rerouteFromCurrentLocation,
  ]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getCurrentProfile()
        .then(profile => {
          if (active) setCurrentProfile(profile);
        })
        .catch(error => {
          console.error('Could not refresh local profile:', error);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    async function loadSavedLocations() {
      try {
        const profile = await getCurrentProfile();
        setCurrentProfile(profile);

        const storageKey = profile
          ? getSavedLocationsKey(profile.email)
          : LEGACY_STORAGE_KEY;

        let stored = await AsyncStorage.getItem(storageKey);

        // Keep saved places from the earlier single-profile version when possible.
        if (!stored && profile) {
          const legacySaved = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);

          if (legacySaved) {
            stored = legacySaved;
            await AsyncStorage.setItem(storageKey, legacySaved);
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        }

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
    return campusLocations.filter(place => {
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

  // Draw or remove the walking route on the Leaflet map.
  useEffect(() => {
    if (!mapReady) return;

    if (!walkingRoute) {
      mapRef.current?.injectJavaScript(
        'window.clearWalkingRoute(); true;'
      );
      return;
    }

    const coordinatesJson = JSON.stringify(
      walkingRoute.coordinates
    ).replace(/</g, '\\u003c');

    mapRef.current?.injectJavaScript(
      `window.drawWalkingRoute(${coordinatesJson}); true;`
    );
  }, [walkingRoute, mapReady]);

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
      const storageKey = currentProfile
        ? getSavedLocationsKey(currentProfile.email)
        : LEGACY_STORAGE_KEY;

      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      setSavedIds(previous);
      console.error('Could not save location:', error);
      Alert.alert('Save failed', 'Could not save this location.');
    }
  }

  function focusLocation(place: (typeof campusLocations)[number]) {
    setWalkingRoute(null);
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

  function startNavigation() {
    if (!walkingRoute || !selected) {
      Alert.alert(
        'No walking route',
        'Calculate a walking route first.'
      );
      return;
    }

    activeStepRef.current = 0;
    offRouteCountRef.current = 0;
    rerouteInProgressRef.current = false;
    lastRerouteAtRef.current = 0;

    setActiveStepIndex(0);
    setRemainingDistance(walkingRoute.distance);
    setOffRoute(false);

    setIsNavigating(true);

    const firstInstruction =
      walkingRoute.steps[0]?.instruction;

    Speech.stop().then(() => {
      Speech.speak(
        `Starting walking navigation to ${selected.name}. ${
          firstInstruction || 'Follow the blue route.'
        }`,
        {
          language: 'en-US',
          rate: 0.95,
          pitch: 1.0,
        }
      );
    });
  }

function stopNavigation() {
  locationSubscription.current?.remove();
  locationSubscription.current = null;

  setIsNavigating(false);
  setOffRoute(false);

  offRouteCountRef.current = 0;

  Speech.stop();
}

  async function openDirections() {
    if (!selected || routeLoading) return;

    try {
      setRouteLoading(true);

      // Request permission to access the user's location.
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location permission required',
          'Allow location access to calculate your walking route.'
        );
        return;
      }

      // Get the user's current GPS position.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const start = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Destination is the selected campus location.
      const destination = {
        latitude: selected.latitude,
        longitude: selected.longitude,
      };

      // Show the user's current location on the map.
      mapRef.current?.injectJavaScript(
        `window.showUserLocation(
          ${start.latitude},
          ${start.longitude}
        ); true;`
      );

      // Request a pedestrian route.
      const route = await getWalkingRoute(
        start,
        destination
      );

      setWalkingRoute(route);

    } catch (error) {
      console.error('Walking route error:', error);

      Alert.alert(
        'Unable to calculate route',
        error instanceof Error
          ? error.message
          : 'Please check your internet connection and try again.'
      );
    } finally {
      setRouteLoading(false);
    }
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

        if (place) {
          setWalkingRoute(null);
          setSelected(place);
        }
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
        <WebView<unknown>
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
                    <Text style={styles.resultName}>
                      {place.name}
                    </Text>

                    <Text style={styles.resultCategory}>
                      {place.category}
                    </Text>
                  </View>

                  {savedIds.includes(String(place.id)) && (
                    <Ionicons
                      name="bookmark"
                      size={18}
                      color={BLUE}
                    />
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
          <Pressable
            style={styles.iconButton}
            onPress={locateMe}
          >
            <Ionicons name="locate" size={23} color={BLUE} />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() =>
              setBaseLayer(current =>
                current === 'osm' ? 'carto' : 'osm'
              )
            }
          >
            <Ionicons
              name="layers-outline"
              size={23}
              color="#263746"
            />
          </Pressable>
        </View>

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

        {/* SELECTED LOCATION — compact by default, expandable by dragging the handle */}
        {selected && (
          <View
            style={[
              styles.placeCard,
              sheetExpanded && styles.placeCardExpanded,
            ]}
          >
            <View
              style={styles.sheetHandleArea}
              {...sheetPanResponder.panHandlers}
            >
              <View style={styles.handle} />
            </View>

            <View style={styles.placeHeader}>
              <View style={styles.placeIcon}>
                <Ionicons name="location" size={22} color={BLUE} />
              </View>

              <View style={styles.placeTitleContainer}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {selected.name}
                </Text>
                <Text style={styles.placeCategory} numberOfLines={1}>
                  {selected.category} · USTP CDO
                </Text>
              </View>

              {!isNavigating && (
                <Pressable
                  style={styles.closePlaceButton}
                  onPress={() => {
                    setSelected(null);
                    setSheetExpanded(false);
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={21} color="#718096" />
                </Pressable>
              )}
            </View>

            {walkingRoute ? (
              <View style={styles.compactRouteRow}>
                <View style={styles.compactMetric}>
                  <Ionicons name="walk-outline" size={18} color={BLUE} />
                  <Text style={styles.compactMetricText}>
                    {isNavigating
                      ? formatDistance(remainingDistance)
                      : formatDistance(walkingRoute.distance)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.compactMetric}>
                  <Ionicons name="time-outline" size={18} color={BLUE} />
                  <Text style={styles.compactMetricText}>
                    {Math.ceil(walkingRoute.duration / 60)} min
                  </Text>
                </View>
                {isNavigating && (
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>LIVE</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.compactDescription} numberOfLines={1}>
                {selected.description}
              </Text>
            )}

            {isNavigating && walkingRoute && (
              <View style={styles.compactInstruction}>
                <Ionicons name="walk" size={18} color={BLUE} />
                <Text style={styles.compactInstructionText} numberOfLines={2}>
                  {walkingRoute.steps[activeStepIndex]?.instruction ??
                    'Continue following the blue route.'}
                </Text>
              </View>
            )}

            <View style={styles.compactActions}>
              {isNavigating ? (
                <Pressable
                  style={styles.stopNavigationButtonCompact}
                  onPress={stopNavigation}
                >
                  <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.stopNavigationText}>End Navigation</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={styles.directionsButton}
                    onPress={openDirections}
                    disabled={routeLoading}
                  >
                    <Ionicons
                      name={routeLoading ? 'hourglass-outline' : 'navigate'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.directionsText}>
                      {routeLoading
                        ? 'Finding Route...'
                        : walkingRoute
                          ? 'Refresh Route'
                          : 'Walking Route'}
                    </Text>
                  </Pressable>

                  {walkingRoute ? (
                    <Pressable
                      style={styles.startNavigationCompact}
                      onPress={startNavigation}
                    >
                      <Ionicons name="play" size={17} color="#FFFFFF" />
                    </Pressable>
                  ) : (
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
                        size={18}
                        color={BLUE}
                      />
                      <Text style={styles.saveText}>
                        {savedIds.includes(String(selected.id)) ? 'Saved' : 'Save'}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>

            {sheetExpanded && (
              <ScrollView
                style={styles.expandedSheetContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.description}>
                  {selected.description}
                </Text>

                {walkingRoute && (
                  <View style={styles.expandedRouteSummary}>
                    <View style={styles.routeInfo}>
                      <Ionicons name="walk" size={20} color={BLUE} />
                      <View>
                        <Text style={styles.routeValue}>
                          {formatDistance(
                            isNavigating
                              ? remainingDistance
                              : walkingRoute.distance
                          )}
                        </Text>
                        <Text style={styles.routeLabel}>
                          {isNavigating ? 'Remaining distance' : 'Walking distance'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.routeInfo}>
                      <Ionicons name="time-outline" size={20} color={BLUE} />
                      <View>
                        <Text style={styles.routeValue}>
                          {Math.ceil(walkingRoute.duration / 60)} min
                        </Text>
                        <Text style={styles.routeLabel}>Estimated time</Text>
                      </View>
                    </View>
                  </View>
                )}

                {isNavigating && walkingRoute && (
                  <View style={styles.navigationPanel}>
                    <View style={styles.navigationHeader}>
                      <Ionicons name="walk" size={21} color={BLUE} />
                      <Text style={styles.navigationTitle}>
                        WALKING NAVIGATION ACTIVE
                      </Text>
                    </View>

                    <Text style={styles.nextInstruction}>
                      {walkingRoute.steps[activeStepIndex]?.instruction ??
                        'Continue following the blue route.'}
                    </Text>

                    <View style={styles.navigationDistance}>
                      <Text style={styles.remainingLabel}>
                        Remaining distance
                      </Text>
                      <Text style={styles.remainingValue}>
                        {formatDistance(remainingDistance)}
                      </Text>
                    </View>

                    {offRoute && (
                      <View style={styles.offRouteWarning}>
                        <Ionicons name="warning" size={18} color="#D97706" />
                        <Text style={styles.offRouteText}>
                          {isRerouting
                            ? 'Recalculating your walking route...'
                            : 'You are away from the walking route. A new route will be calculated.'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {!isNavigating && (
                  <View style={styles.expandedSecondaryActions}>
                    <Pressable
                      style={styles.expandedSaveButton}
                      onPress={() => toggleSaved(selected.id)}
                    >
                      <Ionicons
                        name={
                          savedIds.includes(String(selected.id))
                            ? 'bookmark'
                            : 'bookmark-outline'
                        }
                        size={18}
                        color={BLUE}
                      />
                      <Text style={styles.saveText}>
                        {savedIds.includes(String(selected.id))
                          ? 'Saved'
                          : 'Save location'}
                      </Text>
                    </Pressable>

                    {walkingRoute && (
                      <Pressable
                        style={styles.clearRouteButton}
                        onPress={() => setWalkingRoute(null)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#64748B" />
                        <Text style={styles.clearRouteText}>Clear route</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {isNavigating && offRoute && (
                  <Text style={styles.expandedHint}>
                    Keep the app open while walking so GPS guidance can continue.
                  </Text>
                )}
              </ScrollView>
            )}
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
                <View style={styles.drawerBrandRow}>
                  <View style={styles.drawerLogo}>
                    <Ionicons
                      name="school"
                      size={27}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerTitle}>
                      USTP CDO
                    </Text>

                    <Text style={styles.drawerSubtitle}>
                      CAMPUS NAVIGATOR
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.drawerProfileRow}
                  onPress={() => {
                    setDrawerOpen(false);
                    router.push('/profile');
                  }}
                >
                  <View style={styles.drawerAvatar}>
                    <Text style={styles.drawerAvatarText}>
                      {(currentProfile?.name || 'Guest')
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map(part => part[0]?.toUpperCase() ?? '')
                        .join('') || 'U'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.drawerProfileName}
                      numberOfLines={1}
                    >
                      {currentProfile?.name ?? 'Local profile'}
                    </Text>

                    <Text
                      style={styles.drawerProfileEmail}
                      numberOfLines={1}
                    >
                      {currentProfile?.email ?? 'Tap to set up your profile'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#718096"
                  />
                </Pressable>
              </View>

              <DrawerItem
                icon="person-circle-outline"
                label="My Profile"
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/profile');
                }}
              />

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

                  Alert.alert(
                    'Sign out?',
                    'Your local profile will remain saved on this device.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await signOutLocalProfile();
                            router.replace('/');
                          } catch {
                            Alert.alert(
                              'Could not sign out',
                              'Please try again.'
                            );
                          }
                        },
                      },
                    ]
                  );
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
    <Pressable
      style={styles.drawerItem}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color="#526174"
      />

      <Text style={styles.drawerLabel}>
        {label}
      </Text>
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
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingBottom: 13,
    paddingTop: 5,
    elevation: 12,
    shadowColor: '#102A43',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    zIndex: 8,
    maxHeight: '78%',
  },
  placeCardExpanded: {
    maxHeight: '78%',
  },
  sheetHandleArea: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D2DCE8',
  },
  placeTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  closePlaceButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FA',
  },
  compactDescription: {
    color: '#718096',
    fontSize: 11,
    marginTop: 8,
    marginLeft: 55,
  },
  compactRouteRow: {
    minHeight: 42,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: '#F1F6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  compactMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  compactMetricText: {
    color: '#263746',
    fontSize: 13,
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D9E5F3',
  },
  activePill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E1F5E9',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16834A',
  },
  activePillText: {
    color: '#16834A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compactInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  compactInstructionText: {
    flex: 1,
    color: '#24364B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 11,
  },
  startNavigationCompact: {
    width: 48,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#16834A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNavigationButtonCompact: {
    flex: 1,
    height: 43,
    backgroundColor: '#D93025',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  expandedSheetContent: {
    flexGrow: 0,
    maxHeight: 300,
    marginTop: 4,
  },
  expandedRouteSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F6FF',
    borderRadius: 13,
    padding: 12,
    marginTop: 12,
  },
  expandedSecondaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 3,
  },
  expandedSaveButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#EAF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  clearRouteButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#F3F5F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  clearRouteText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedHint: {
    color: '#718096',
    fontSize: 10,
    marginTop: 10,
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
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  drawerLogo: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerProfileRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DCE7F5',
  },
  drawerAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5E4F8',
  },
  drawerAvatarText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '900',
  },
  drawerProfileName: {
    color: '#172B4D',
    fontSize: 13,
    fontWeight: '800',
  },
  drawerProfileEmail: {
    color: '#718096',
    fontSize: 10,
    marginTop: 3,
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

  routeSummary: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#EAF2FF',
  borderRadius: 14,
  padding: 12,
  marginTop: 13,
},

routeInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

routeValue: {
  fontSize: 14,
  fontWeight: '800',
  color: '#1D2D40',
},

routeLabel: {
  fontSize: 10,
  color: '#718096',
  marginTop: 2,
},
  startNavigationButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: '#16834A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 13,
  },
  startNavigationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  navigationPanel: {
    backgroundColor: '#F1F6FF',
    borderRadius: 15,
    padding: 13,
    marginTop: 13,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navigationTitle: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '900',
  },
  nextInstruction: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D2D40',
    lineHeight: 22,
    marginTop: 12,
  },
  navigationDistance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCE7F5',
  },
  remainingLabel: {
    color: '#718096',
    fontSize: 12,
  },
  remainingValue: {
    color: BLUE,
    fontWeight: '900',
    fontSize: 16,
  },
  offRouteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF4DF',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  offRouteText: {
    flex: 1,
    color: '#92400E',
    fontSize: 11,
    lineHeight: 16,
  },
  stopNavigationButton: {
    height: 44,
    backgroundColor: '#D93025',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  stopNavigationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
