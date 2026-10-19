import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function continueToMap() {
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      Alert.alert('Missing information', 'Please complete the required fields.');
      return;
    }
    // Demo only: connect Firebase/Auth before using real accounts.
    router.replace('/map');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={23} color="#24364B" /></Pressable>
        <View style={styles.logo}><Ionicons name="school" size={30} color="#fff" /></View>
        <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>{mode === 'signin' ? 'Sign in to explore your campus.' : 'Join the USTP campus community.'}</Text>
        <View style={styles.tabs}>
          <Pressable onPress={() => setMode('signin')} style={[styles.tab, mode === 'signin' && styles.activeTab]}><Text style={[styles.tabText,mode === 'signin'&&styles.activeTabText]}>Sign In</Text></Pressable>
          <Pressable onPress={() => setMode('signup')} style={[styles.tab, mode === 'signup' && styles.activeTab]}><Text style={[styles.tabText,mode === 'signup'&&styles.activeTabText]}>Sign Up</Text></Pressable>
        </View>
        {mode === 'signup' && <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />}
        <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {mode === 'signin' && <Pressable onPress={() => Alert.alert('Forgot password', 'Password recovery will be available after authentication is connected.')}><Text style={styles.forgot}>Forgot password?</Text></Pressable>}
        <Pressable style={styles.button} onPress={continueToMap}><Text style={styles.buttonText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text><Ionicons name="arrow-forward" size={19} color="#fff" /></Pressable>
        <Text style={styles.terms}>By continuing, you agree to use campus location services responsibly.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},container:{flex:1,paddingHorizontal:26,paddingTop:10},
  back:{width:44,height:44,borderRadius:14,backgroundColor:'#F2F5F9',alignItems:'center',justifyContent:'center',marginBottom:28},
  logo:{width:58,height:58,borderRadius:18,backgroundColor:'#1A73E8',alignItems:'center',justifyContent:'center',marginBottom:20},
  title:{fontSize:29,fontWeight:'800',color:'#172B4D'},subtitle:{fontSize:14,color:'#718096',marginTop:8,marginBottom:26},
  tabs:{flexDirection:'row',backgroundColor:'#F1F4F8',borderRadius:13,padding:4,marginBottom:20},
  tab:{flex:1,paddingVertical:12,alignItems:'center',borderRadius:10},activeTab:{backgroundColor:'#fff',elevation:2},
  tabText:{fontWeight:'700',color:'#8290A2'},activeTabText:{color:'#1A73E8'},
  input:{height:54,borderWidth:1,borderColor:'#E1E7EF',borderRadius:13,paddingHorizontal:16,marginBottom:13,fontSize:15,color:'#172B4D'},
  forgot:{alignSelf:'flex-end',color:'#1A73E8',fontWeight:'700',marginTop:2,marginBottom:22},
  button:{height:56,borderRadius:15,backgroundColor:'#1A73E8',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:12},
  buttonText:{color:'#fff',fontWeight:'800',fontSize:16},terms:{textAlign:'center',fontSize:11,lineHeight:17,color:'#9AA6B2',marginTop:22}
});
