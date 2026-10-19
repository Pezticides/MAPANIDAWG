import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.mapCircle}><Ionicons name="navigate" size={58} color="#fff" /></View>
        <View style={[styles.pin, styles.pinOne]}><Ionicons name="location" size={28} color="#1A73E8" /></View>
        <View style={[styles.pin, styles.pinTwo]}><Ionicons name="location" size={24} color="#EA4335" /></View>
        <View style={styles.routeLine} />
        <Text style={styles.eyebrow}>YOUR CAMPUS, MADE SIMPLE</Text>
      </View>
      <SafeAreaView style={styles.content} edges={['bottom']}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Ionicons name="school" size={25} color="#fff" /></View>
          <View><Text style={styles.brand}>USTP CDO</Text><Text style={styles.brandSub}>CAMPUS NAVIGATOR</Text></View>
        </View>
        <Text style={styles.title}>Find your way{'\n'}around campus.</Text>
        <Text style={styles.description}>Discover buildings, locate campus facilities, and get where you need to go with confidence.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/auth')}>
          <Text style={styles.buttonText}>Get Started</Text><Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.footer}>A smarter way to explore USTP.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#fff'},
  hero:{flex:1.12,backgroundColor:'#EAF2FB',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  mapCircle:{width:150,height:150,borderRadius:75,backgroundColor:'#1A73E8',alignItems:'center',justifyContent:'center',elevation:8,zIndex:2},
  pin:{position:'absolute',backgroundColor:'#fff',width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',elevation:5,zIndex:3},
  pinOne:{top:'24%',left:'19%'},pinTwo:{bottom:'22%',right:'17%'},
  routeLine:{position:'absolute',width:250,height:140,borderWidth:4,borderColor:'#8BB7F0',borderRadius:100,transform:[{rotate:'-28deg'}]},
  eyebrow:{position:'absolute',bottom:26,fontSize:11,fontWeight:'800',letterSpacing:2,color:'#52708E'},
  content:{flex:1,paddingHorizontal:28,paddingTop:25},
  brandRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:25},
  brandMark:{width:45,height:45,borderRadius:14,backgroundColor:'#1A73E8',alignItems:'center',justifyContent:'center'},
  brand:{fontSize:16,fontWeight:'800',color:'#172B4D',letterSpacing:1},
  brandSub:{fontSize:10,fontWeight:'700',color:'#6B7C93',letterSpacing:1.5,marginTop:3},
  title:{fontSize:35,lineHeight:42,fontWeight:'800',color:'#172B4D',letterSpacing:-1},
  description:{fontSize:15,lineHeight:23,color:'#68778D',marginTop:13,marginBottom:25},
  button:{height:56,borderRadius:16,backgroundColor:'#1A73E8',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},
  buttonText:{fontSize:16,fontWeight:'700',color:'#fff'},
  footer:{textAlign:'center',color:'#9AA6B2',fontSize:12,marginTop:17}
});
