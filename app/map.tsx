import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Keyboard, Alert, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CAMPUS_CENTER, campusLocations, CampusLocation } from '../data/campusLocations';

const BLUE = '#1A73E8';
const categories = ['All', 'Academic', 'Office', 'Food', 'Facility'] as const;

export default function CampusMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CampusLocation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [satellite, setSatellite] = useState(false);
  const [userCoords, setUserCoords] = useState<{latitude:number;longitude:number}|null>(null);

  const filtered = useMemo(() => campusLocations.filter(p =>
    (category === 'All' || p.category === category) &&
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  ), [query, category]);

  function focusLocation(place: CampusLocation) {
    setSelected(place);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({ latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.0018, longitudeDelta: 0.0018 }, 500);
  }

  async function locateMe() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location permission', 'Allow location access in your device settings to show your position.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    setUserCoords(coords);
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.002, longitudeDelta: 0.002 }, 500);
  }

  function openDirections() {
    if (!selected) return;
    const destination = `${selected.latitude},${selected.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url).catch(() => Alert.alert('Unable to open directions', 'Please try again.'));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={CAMPUS_CENTER as Region}
          mapType={satellite ? 'satellite' : 'standard'}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          onPress={() => { if (!query) setSelected(null); }}
        >
          {filtered.map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={place.description}
              onPress={() => setSelected(place)}
              pinColor={selected?.id === place.id ? '#EA4335' : BLUE}
            />
          ))}
          {userCoords && <Marker coordinate={userCoords} title="Your location" pinColor="#34A853" />}
        </MapView>

        <View style={styles.topSearch}>
          <Pressable style={styles.menuButton} onPress={() => setDrawerOpen(true)}><Ionicons name="menu" size={25} color="#263746" /></Pressable>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#6B7785" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search campus locations"
              placeholderTextColor="#8793A1"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color="#8793A1" /></Pressable>}
          </View>
        </View>

        {query.length > 0 && (
          <View style={styles.searchResults}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map(place => (
                <Pressable key={place.id} style={styles.resultRow} onPress={() => focusLocation(place)}>
                  <View style={styles.resultIcon}><Ionicons name="location" size={18} color={BLUE} /></View>
                  <View style={{flex:1}}><Text style={styles.resultName}>{place.name}</Text><Text style={styles.resultMeta}>{place.category}</Text></View>
                </Pressable>
              ))}
              {filtered.length === 0 && <Text style={styles.empty}>No matching campus locations.</Text>}
            </ScrollView>
          </View>
        )}

        <View style={styles.mapControls}>
          <Pressable style={styles.controlButton} onPress={locateMe}><Ionicons name="locate" size={22} color={BLUE} /></Pressable>
          <Pressable style={styles.controlButton} onPress={() => setSatellite(v => !v)}><Ionicons name="layers-outline" size={22} color="#263746" /></Pressable>
        </View>

        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingHorizontal:14}}>
            {categories.map(item => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryActive]}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {selected && (
          <View style={styles.placeCard}>
            <View style={styles.handle} />
            <View style={styles.placeHeader}>
              <View style={styles.placeIcon}><Ionicons name="location" size={23} color={BLUE} /></View>
              <View style={{flex:1}}>
                <Text style={styles.placeName}>{selected.name}</Text>
                <Text style={styles.placeCategory}>{selected.category} · USTP CDO</Text>
              </View>
              <Pressable onPress={() => setSelected(null)}><Ionicons name="close" size={23} color="#718096" /></Pressable>
            </View>
            <Text style={styles.placeDescription}>{selected.description}</Text>
            <View style={styles.actionRow}>
              <Pressable style={styles.primaryAction} onPress={openDirections}><Ionicons name="navigate" size={18} color="#fff" /><Text style={styles.primaryActionText}>Directions</Text></Pressable>
              <Pressable style={styles.secondaryAction} onPress={() => Alert.alert('Saved places', 'Saved-place storage will be added in the next step.')}><Ionicons name="bookmark-outline" size={18} color={BLUE} /><Text style={styles.secondaryText}>Save</Text></Pressable>
            </View>
          </View>
        )}

        {drawerOpen && (
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.scrim} onPress={() => setDrawerOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerLogo}><Ionicons name="school" size={26} color="#fff" /></View>
                <Text style={styles.drawerTitle}>USTP CDO</Text>
                <Text style={styles.drawerSub}>CAMPUS NAVIGATOR</Text>
              </View>
              {[
                {icon:'map-outline', label:'Campus Map', action:()=>setDrawerOpen(false)},
                {icon:'business-outline', label:'Explore Buildings', action:()=>{setCategory('Academic');setDrawerOpen(false)}},
                {icon:'grid-outline', label:'Categories', action:()=>{setCategory('All');setDrawerOpen(false)}},
                {icon:'bookmark-outline', label:'Saved Locations', action:()=>Alert.alert('Saved Locations','Saved locations will be added next.')},
                {icon:'information-circle-outline', label:'About USTP', action:()=>Alert.alert('About','USTP CDO Campus Navigator helps students and visitors explore campus locations.')},
                {icon:'settings-outline', label:'Settings', action:()=>Alert.alert('Settings','App settings will be added next.')},
              ].map(item => (
                <Pressable key={item.label} style={styles.drawerItem} onPress={item.action as any}>
                  <Ionicons name={item.icon as any} size={21} color={item.label==='Campus Map'?BLUE:'#526174'} />
                  <Text style={[styles.drawerLabel,item.label==='Campus Map'&&{color:BLUE,fontWeight:'800'}]}>{item.label}</Text>
                </Pressable>
              ))}
              <View style={styles.drawerDivider} />
              <Pressable style={styles.drawerItem} onPress={() => {setDrawerOpen(false);router.replace('/')}}><Ionicons name="log-out-outline" size={21} color="#D64545" /><Text style={[styles.drawerLabel,{color:'#D64545'}]}>Sign Out</Text></Pressable>
              <Text style={styles.drawerVersion}>Version 1.0 · Student project</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},mapWrap:{flex:1,backgroundColor:'#E7EDF2'},
  topSearch:{position:'absolute',top:10,left:12,right:12,flexDirection:'row',gap:9,alignItems:'center'},
  menuButton:{width:48,height:48,borderRadius:15,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',elevation:4},
  searchBox:{flex:1,height:48,borderRadius:15,backgroundColor:'#fff',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10,elevation:4},
  searchInput:{flex:1,fontSize:14,color:'#263746',paddingVertical:0},
  searchResults:{position:'absolute',top:65,left:69,right:12,maxHeight:260,backgroundColor:'#fff',borderRadius:14,elevation:8,overflow:'hidden'},
  resultRow:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderBottomWidth:1,borderBottomColor:'#F0F2F5'},
  resultIcon:{width:34,height:34,borderRadius:17,backgroundColor:'#EAF2FF',alignItems:'center',justifyContent:'center'},
  resultName:{fontSize:13,fontWeight:'700',color:'#263746'},resultMeta:{fontSize:11,color:'#8491A1',marginTop:3},empty:{padding:16,color:'#718096'},
  mapControls:{position:'absolute',right:14,top:82,gap:10},
  controlButton:{width:46,height:46,borderRadius:15,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',elevation:4},
  categoryBar:{position:'absolute',top:145,left:0,right:0},
  categoryChip:{paddingHorizontal:16,paddingVertical:10,borderRadius:22,backgroundColor:'#fff',elevation:3},
  categoryActive:{backgroundColor:'#1A73E8'},categoryText:{fontSize:12,fontWeight:'700',color:'#435267'},categoryTextActive:{color:'#fff'},
  placeCard:{position:'absolute',bottom:14,left:12,right:12,backgroundColor:'#fff',borderRadius:22,padding:16,elevation:8},
  handle:{alignSelf:'center',width:36,height:4,borderRadius:3,backgroundColor:'#D9E0E7',marginBottom:14},
  placeHeader:{flexDirection:'row',alignItems:'center',gap:11},
  placeIcon:{width:44,height:44,borderRadius:14,backgroundColor:'#EAF2FF',alignItems:'center',justifyContent:'center'},
  placeName:{fontSize:16,fontWeight:'800',color:'#1D2D40'},placeCategory:{fontSize:11,color:'#7B8999',marginTop:4},
  placeDescription:{fontSize:12,lineHeight:18,color:'#68778D',marginTop:12},
  actionRow:{flexDirection:'row',gap:10,marginTop:15},
  primaryAction:{flex:1,height:45,borderRadius:13,backgroundColor:BLUE,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  primaryActionText:{color:'#fff',fontWeight:'800',fontSize:13},
  secondaryAction:{paddingHorizontal:18,height:45,borderRadius:13,backgroundColor:'#EAF2FF',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  secondaryText:{color:BLUE,fontWeight:'800',fontSize:13},
  drawerOverlay:{...StyleSheet.absoluteFill,flexDirection:'row',zIndex:20},
  scrim:{...StyleSheet.absoluteFill,backgroundColor:'rgba(12,25,42,0.35)'},
  drawer:{width:'82%',maxWidth:330,backgroundColor:'#fff',height:'100%',paddingTop:25,paddingHorizontal:18,elevation:12},
  drawerHeader:{backgroundColor:'#EAF2FF',borderRadius:18,padding:18,marginBottom:17},
  drawerLogo:{width:47,height:47,borderRadius:15,backgroundColor:BLUE,alignItems:'center',justifyContent:'center',marginBottom:12},
  drawerTitle:{fontSize:19,fontWeight:'900',color:'#172B4D',letterSpacing:1},drawerSub:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#718096',marginTop:4},
  drawerItem:{height:49,flexDirection:'row',alignItems:'center',gap:15,paddingHorizontal:12,borderRadius:12},
  drawerLabel:{fontSize:14,fontWeight:'600',color:'#435267'},
  drawerDivider:{height:1,backgroundColor:'#EDF0F4',marginVertical:10},
  drawerVersion:{position:'absolute',bottom:22,left:30,fontSize:11,color:'#A0AAB6'}
});
