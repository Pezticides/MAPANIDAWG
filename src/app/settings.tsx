import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type AppLanguage,
  type AppTheme,
  type MapPreferences,
  type NotificationPreferences,
  useSettings,
} from '../context/SettingsContext';
import { signOutLocalProfile } from '../lib/localProfile';
import { supabase } from '../lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

type AccountForm = 'password' | 'email' | null;
type NotificationKey = keyof NotificationPreferences;

const notificationItems: {
  key: NotificationKey;
  title: string;
  description: string;
}[] = [
  {
    key: 'campusAnnouncements',
    title: 'Campus announcements',
    description: 'News and notices from campus',
  },
  {
    key: 'facilityUpdates',
    title: 'Building and facility updates',
    description: 'Changes to campus places and services',
  },
  {
    key: 'eventNotifications',
    title: 'Events',
    description: 'Upcoming campus activities',
  },
  {
    key: 'maintenanceAnnouncements',
    title: 'Maintenance',
    description: 'Closures and service interruptions',
  },
  {
    key: 'appUpdates',
    title: 'App updates',
    description: 'New features and improvements',
  },
];

export default function SettingsScreen() {
  const {
    colors,
    isReady,
    language,
    mapPreferences,
    notifications,
    resolvedTheme,
    setLanguage,
    setTheme,
    t,
    theme,
    updateMapPreferences,
    updateNotifications,
  } = useSettings();
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>(null);
  const [formValue, setFormValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [locationPermission, setLocationPermission] = useState('Checking…');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccountStatus() {
      try {
        const [{ data, error }, permission] = await Promise.all([
          supabase.auth.getUser(),
          Location.getForegroundPermissionsAsync(),
        ]);
        if (error) throw error;

        if (active) {
          setEmail(data.user?.email ?? '');
          setEmailVerified(Boolean(data.user?.email_confirmed_at));
          setLocationPermission(
            permission.granted ? 'Allowed' : 'Not allowed'
          );
        }
      } catch (error) {
        console.error('Could not load settings account status:', error);
        if (active) {
          setEmailVerified(null);
          setLocationPermission('Unavailable');
        }
      }
    }

    void loadAccountStatus();
    return () => {
      active = false;
    };
  }, []);

  async function updateSetting(update: () => Promise<void>) {
    setSaving(true);
    try {
      await update();
    } catch (error) {
      console.error('Could not save app settings:', error);
      Alert.alert(
        'Could not save settings',
        error instanceof Error
          ? error.message
          : 'Please check your device storage and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function chooseTheme(value: AppTheme) {
    void updateSetting(() => setTheme(value));
  }

  function chooseLanguage(value: AppLanguage) {
    void updateSetting(() => setLanguage(value));
  }

  function changeMapPreference(value: Partial<MapPreferences>) {
    void updateSetting(() => updateMapPreferences(value));
  }

  function changeNotification(key: NotificationKey, value: boolean) {
    void updateSetting(() => updateNotifications({ [key]: value }));
  }

  async function changeMapZoom(amount: number) {
    const zoom = Math.min(20, Math.max(13, mapPreferences.defaultZoom + amount));
    await updateSetting(() => updateMapPreferences({ defaultZoom: zoom }));
  }

  function openAccountForm(form: Exclude<AccountForm, null>) {
    setFormValue('');
    setConfirmValue('');
    setAccountForm(form);
  }

  async function submitAccountForm() {
    const value = formValue.trim();

    if (accountForm === 'password') {
      if (formValue.length < 8) {
        Alert.alert('Password too short', 'Use at least 8 characters.');
        return;
      }
      if (formValue !== confirmValue) {
        Alert.alert('Passwords do not match', 'Check both password fields.');
        return;
      }
    } else if (accountForm === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        Alert.alert('Invalid email', 'Enter a valid email address.');
        return;
      }
      if (value.toLowerCase() === email.toLowerCase()) {
        Alert.alert('No change', 'That is already your current email address.');
        return;
      }
    } else {
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser(
        accountForm === 'password'
          ? { password: formValue }
          : { email: value }
      );
      if (error) throw error;

      setAccountForm(null);
      if (accountForm === 'email') {
        setEmail(data.user?.email ?? email);
        setEmailVerified(Boolean(data.user?.email_confirmed_at));
        Alert.alert(
          'Check your inbox',
          'Follow the confirmation link sent by Supabase to finish changing your email address.'
        );
      } else {
        Alert.alert('Password updated', 'Your password has been changed.');
      }
    } catch (error) {
      Alert.alert(
        accountForm === 'email' ? 'Could not change email' : 'Could not change password',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function resendVerificationEmail() {
    if (!email) {
      Alert.alert('No email address', 'Sign in again and retry this action.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      Alert.alert(
        'Verification email sent',
        'Check your inbox and follow the confirmation link.'
      );
    } catch (error) {
      Alert.alert(
        'Could not send verification email',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function manageLocationPermission() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(permission.granted ? 'Allowed' : 'Not allowed');
      if (!permission.granted) {
        Alert.alert(
          'Location permission is off',
          'Allow location access in device settings to use your current location.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Could not request location permission:', error);
      Alert.alert(
        'Could not check location permission',
        'Open your device settings to manage location access.'
      );
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can sign in again at any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutLocalProfile();
          } catch (error) {
            Alert.alert(
              'Could not sign out',
              error instanceof Error ? error.message : 'Please try again.'
            );
          }
        },
      },
    ]);
  }

  function showPrivacyInformation() {
    Alert.alert(
      'Privacy and data',
      'Your account and saved places are stored by Supabase. App preferences are stored on this device. Your location is requested only when you use location or walking-navigation features; it is not saved by this app.'
    );
  }

  async function deleteAccountPermanently() {
    setDeletingAccount(true);
    let accountDeleted = false;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        throw new Error('Sign in before deleting your account.');
      }

      const { data, error } = await supabase.functions.invoke<{
        deleted: boolean;
      }>('delete-account', { method: 'POST' });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const response = error.context as Response;
          const body: unknown = await response.json().catch(() => null);
          if (
            body &&
            typeof body === 'object' &&
            'error' in body &&
            typeof body.error === 'string'
          ) {
            throw new Error(body.error);
          }
          if (response.status === 404) {
            throw new Error(
              'The secure account-deletion function is not deployed. Contact the app administrator.'
            );
          }
        }
        throw error;
      }
      if (!data?.deleted) {
        throw new Error('The server did not confirm account deletion.');
      }
      accountDeleted = true;

      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError) {
        throw new Error(
          'Your account was deleted, but this device could not clear its saved session. Restart the app and sign in again.'
        );
      }

      setDeleteDialogVisible(false);
      setDeleteConfirmation('');
      router.replace('/');
    } catch (error) {
      if (accountDeleted) {
        setDeleteDialogVisible(false);
        Alert.alert(
          'Account deleted',
          error instanceof Error
            ? error.message
            : 'Your account was deleted. Restart the app to clear this device session.'
        );
        router.replace('/');
        return;
      }

      Alert.alert(
        'Could not delete account',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  function showFaq() {
    Alert.alert(
      'Frequently asked questions',
      'How do I find a place? Use Search or browse the map markers.\n\nCan I explore without an account? Yes, choose Explore as guest.\n\nHow do I save places across devices? Sign in before saving a location.'
    );
  }

  function reportFeedback() {
    void Linking.openURL(
      'mailto:?subject=USTP%20Campus%20Navigator%20feedback'
    ).catch(error => {
      console.error('Could not open email app:', error);
      Alert.alert(
        'Unable to open email',
        'Please send feedback using your preferred email application.'
      );
    });
  }

  function showTermsNotice() {
    Alert.alert(
      'Terms of service',
      'The app does not yet include a published terms-of-service document. Use campus services and map information responsibly, and confirm important details with USTP.'
    );
  }

  const appVersion =
    Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.topBar, { backgroundColor: colors.card }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.topTitle, { color: colors.text }]}>
            {t('settingsTitle')}
          </Text>
          <Text style={[styles.headerCaption, { color: colors.secondaryText }]}>
            USTP CAMPUS NAVIGATOR
          </Text>
        </View>
        <View style={styles.topSpacer} />
      </View>

      {!isReady ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Make it yours
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.secondaryText }]}>
              Manage your account, map, and app preferences.
            </Text>
          </View>

          <Section
            title="Account and Profile"
            subtitle="Manage your personal information"
            colors={colors}
          >
            <SettingRow
              icon="person-circle-outline"
              title="Edit profile information"
              detail="Update your name and profile"
              colors={colors}
              onPress={() => router.push('/profile')}
            />
            <SettingRow
              icon="key-outline"
              title="Change password"
              detail="Update your sign-in password"
              colors={colors}
              onPress={() => openAccountForm('password')}
            />
            <SettingRow
              icon="mail-outline"
              title="Change email address"
              detail={email || 'Update your sign-in email'}
              colors={colors}
              onPress={() => openAccountForm('email')}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Email verification"
              detail={
                emailVerified === null
                  ? 'Status unavailable'
                  : emailVerified
                    ? 'Your email is verified'
                    : 'Your email is not verified'
              }
              detailColor={
                emailVerified
                  ? '#16834A'
                  : emailVerified === false
                    ? '#C26A12'
                    : undefined
              }
              colors={colors}
              trailing={
                emailVerified === false ? (
                  <Text style={styles.inlineAction}>Resend</Text>
                ) : undefined
              }
              onPress={
                emailVerified === false
                  ? () => void resendVerificationEmail()
                  : undefined
              }
            />
            <SettingRow
              icon="phone-portrait-outline"
              title="Manage active sessions"
              detail="Sign out of other devices"
              colors={colors}
              onPress={() =>
                Alert.alert(
                  'Sign out other sessions?',
                  'This will end your sessions on other devices.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign out other sessions',
                      onPress: async () => {
                        try {
                          const { error } = await supabase.auth.signOut({
                            scope: 'others',
                          });
                          if (error) throw error;
                          Alert.alert(
                            'Sessions ended',
                            'Other sessions have been signed out.'
                          );
                        } catch (error) {
                          Alert.alert(
                            'Could not manage sessions',
                            error instanceof Error
                              ? error.message
                              : 'Please try again.'
                          );
                        }
                      },
                    },
                  ]
                )
              }
            />
            <SettingRow
              icon="trash-outline"
              title="Delete account"
              detail="Permanently remove your account and saved places"
              colors={colors}
              destructive
              onPress={() => {
                setDeleteConfirmation('');
                setDeleteDialogVisible(true);
              }}
            />
          </Section>

          <Section
            title="Preferences"
            subtitle="Personalize how the app looks and works"
            colors={colors}
          >
            <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>
              APPEARANCE
            </Text>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              {t('theme')}
            </Text>
            <View style={styles.choiceRow}>
              <Choice
                label={t('light')}
                icon="sunny-outline"
                selected={theme === 'light'}
                colors={colors}
                onPress={() => chooseTheme('light')}
              />
              <Choice
                label={t('dark')}
                icon="moon-outline"
                selected={theme === 'dark'}
                colors={colors}
                onPress={() => chooseTheme('dark')}
              />
              <Choice
                label={t('system')}
                icon="phone-portrait-outline"
                selected={theme === 'system'}
                colors={colors}
                onPress={() => chooseTheme('system')}
              />
            </View>
            <Text style={[styles.helperText, { color: colors.secondaryText }]}>
              Currently using {resolvedTheme} appearance.
            </Text>

            <Text style={[styles.groupLabel, styles.spacedGroup, { color: colors.secondaryText }]}>
              LANGUAGE
            </Text>
            <View style={styles.choiceRow}>
              <Choice
                label={t('english')}
                icon="language-outline"
                selected={language === 'en'}
                colors={colors}
                onPress={() => chooseLanguage('en')}
              />
              <Choice
                label={t('filipino')}
                icon="language-outline"
                selected={language === 'fil'}
                colors={colors}
                onPress={() => chooseLanguage('fil')}
              />
            </View>
          </Section>

          <Section
            title="Map Preferences"
            subtitle="Choose how the campus map is displayed"
            colors={colors}
          >
            <Text style={[styles.groupLabel, { color: colors.secondaryText }]}>
              DEFAULT MAP TYPE
            </Text>
            <View style={styles.choiceRow}>
              <Choice
                label="Standard"
                icon="map-outline"
                selected={mapPreferences.mapType === 'standard'}
                colors={colors}
                onPress={() => changeMapPreference({ mapType: 'standard' })}
              />
              <Choice
                label="Satellite"
                icon="globe-outline"
                selected={mapPreferences.mapType === 'satellite'}
                colors={colors}
                onPress={() => changeMapPreference({ mapType: 'satellite' })}
              />
            </View>
            <PreferenceSwitch
              title="Location markers"
              description="Show campus buildings and facilities"
              value={mapPreferences.showMarkers}
              disabled={saving}
              colors={colors}
              onValueChange={value =>
                changeMapPreference({ showMarkers: value })
              }
            />
            <PreferenceSwitch
              title="Current location marker"
              description="Show your position when using location"
              value={mapPreferences.showCurrentLocation}
              disabled={saving}
              colors={colors}
              onValueChange={value =>
                changeMapPreference({ showCurrentLocation: value })
              }
            />
            <View style={[styles.zoomRow, { borderTopColor: colors.border }]}>
              <View style={styles.zoomInfo}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Default map zoom
                </Text>
                <Text style={[styles.rowDetail, { color: colors.secondaryText }]}>
                  Used when opening the map
                </Text>
              </View>
              <Pressable
                style={[styles.zoomButton, { borderColor: colors.border }]}
                onPress={() => void changeMapZoom(-1)}
                disabled={saving || mapPreferences.defaultZoom <= 13}
                accessibilityLabel="Zoom out by one level"
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>
              <Text style={[styles.zoomValue, { color: colors.text }]}>
                {mapPreferences.defaultZoom}
              </Text>
              <Pressable
                style={[styles.zoomButton, { borderColor: colors.border }]}
                onPress={() => void changeMapZoom(1)}
                disabled={saving || mapPreferences.defaultZoom >= 20}
                accessibilityLabel="Zoom in by one level"
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>
            <SettingRow
              icon="navigate-outline"
              title="Location permission"
              detail={`Status: ${locationPermission}`}
              colors={colors}
              onPress={() => void manageLocationPermission()}
            />
            <SettingRow
              icon="walk-outline"
              title="Navigation mode"
              detail="Walking directions"
              colors={colors}
              showChevron={false}
            />
          </Section>

          <Section
            title="Notifications"
            subtitle="Choose the updates you would like to receive"
            colors={colors}
          >
            {notificationItems.map((item, index) => (
              <PreferenceSwitch
                key={item.key}
                title={item.title}
                description={item.description}
                value={notifications[item.key]}
                disabled={saving}
                colors={colors}
                isLast={index === notificationItems.length - 1}
                onValueChange={value => changeNotification(item.key, value)}
              />
            ))}
            <Text style={[styles.notice, { color: colors.secondaryText }]}>
              These preferences are saved on this device. Push notifications
              are not enabled in this app build.
            </Text>
          </Section>

          <Section
            title="Privacy and Support"
            subtitle="Security, help, and app information"
            colors={colors}
          >
            <SettingRow
              icon="location-outline"
              title="Location privacy"
              detail="How location access is used"
              colors={colors}
              onPress={showPrivacyInformation}
            />
            <SettingRow
              icon="lock-closed-outline"
              title="Privacy and data"
              detail="Review how app data is stored"
              colors={colors}
              onPress={showPrivacyInformation}
            />
            <SettingRow
              icon="help-circle-outline"
              title="Frequently asked questions"
              detail="Quick answers about using the app"
              colors={colors}
              onPress={showFaq}
            />
            <SettingRow
              icon="bug-outline"
              title="Report a problem"
              detail="Send a report using your email app"
              colors={colors}
              onPress={reportFeedback}
            />
            <SettingRow
              icon="chatbubble-ellipses-outline"
              title="Send feedback"
              detail="Share an idea or suggestion"
              colors={colors}
              onPress={reportFeedback}
            />
            <SettingRow
              icon="business-outline"
              title="Contact campus administrators"
              detail="Visit the official USTP website"
              colors={colors}
              onPress={() =>
                void Linking.openURL('https://www.ustp.edu.ph/').catch(error => {
                  console.error('Could not open USTP website:', error);
                  Alert.alert(
                    'Unable to open website',
                    'Please try again later.'
                  );
                })
              }
            />
            <SettingRow
              icon="document-text-outline"
              title="Terms of service"
              detail="Terms information"
              colors={colors}
              onPress={showTermsNotice}
            />
            <SettingRow
              icon="information-circle-outline"
              title="About USTP Campus Navigator"
              detail={`Version ${appVersion}`}
              colors={colors}
              onPress={() => router.push('/about')}
            />
          </Section>

          <Pressable
            style={[styles.signOutButton, { borderColor: colors.border }]}
            onPress={confirmSignOut}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color="#C2413A" />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          <Text style={[styles.footer, { color: colors.secondaryText }]}>
            USTP CAMPUS NAVIGATOR · {appVersion}
          </Text>
        </ScrollView>
      )}

      <Modal
        visible={accountForm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountForm(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {accountForm === 'password'
                ? 'Change password'
                : 'Change email address'}
            </Text>
            <Text style={[styles.modalDescription, { color: colors.secondaryText }]}>
              {accountForm === 'password'
                ? 'Enter a new password with at least 8 characters.'
                : 'A confirmation link will be sent to your new email.'}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={formValue}
              onChangeText={setFormValue}
              placeholder={
                accountForm === 'password' ? 'New password' : 'New email address'
              }
              placeholderTextColor={colors.secondaryText}
              secureTextEntry={accountForm === 'password'}
              keyboardType={accountForm === 'email' ? 'email-address' : 'default'}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              autoFocus
            />
            {accountForm === 'password' && (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                value={confirmValue}
                onChangeText={setConfirmValue}
                placeholder="Confirm new password"
                placeholderTextColor={colors.secondaryText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => setAccountForm(null)}
                disabled={saving}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={() => void submitAccountForm()}
                disabled={saving}
              >
                <Text style={styles.modalPrimaryText}>
                  {saving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) setDeleteDialogVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete your account permanently?
            </Text>
            <Text style={[styles.modalDescription, { color: colors.secondaryText }]}>
              This permanently deletes your Supabase account, profile, and saved
              places. This cannot be undone. Type DELETE to confirm.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="Type DELETE"
              placeholderTextColor={colors.secondaryText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deletingAccount}
              accessibilityLabel="Type DELETE to confirm account deletion"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => setDeleteDialogVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalDelete,
                  (deleteConfirmation.trim().toUpperCase() !== 'DELETE' ||
                    deletingAccount) &&
                    styles.modalDeleteDisabled,
                ]}
                onPress={() => void deleteAccountPermanently()}
                disabled={
                  deleteConfirmation.trim().toUpperCase() !== 'DELETE' ||
                  deletingAccount
                }
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Delete account</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  colors,
  children,
}: {
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useSettings>['colors'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
        {subtitle}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  colors,
  onPress,
  trailing,
  detailColor,
  destructive = false,
  showChevron = true,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail: string;
  colors: ReturnType<typeof useSettings>['colors'];
  onPress?: () => void;
  trailing?: React.ReactNode;
  detailColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: destructive ? '#FFF0EF' : colors.surface },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={destructive ? '#C2413A' : '#1A73E8'}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text
          style={[
            styles.rowTitle,
            { color: destructive ? '#C2413A' : colors.text },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.rowDetail,
            { color: detailColor ?? colors.secondaryText },
          ]}
        >
          {detail}
        </Text>
      </View>
      {trailing}
      {showChevron && onPress && (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={colors.secondaryText}
          style={styles.rowChevron}
        />
      )}
    </Pressable>
  );
}

function PreferenceSwitch({
  title,
  description,
  value,
  disabled,
  colors,
  isLast = false,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useSettings>['colors'];
  isLast?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={[
        styles.preferenceRow,
        !isLast && { borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: colors.secondaryText }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: '#91BDF5' }}
        thumbColor={value ? '#1A73E8' : undefined}
        accessibilityLabel={title}
      />
    </View>
  );
}

function Choice({
  label,
  icon,
  selected,
  colors,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  colors: ReturnType<typeof useSettings>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.choice,
        {
          backgroundColor: selected ? colors.selected : colors.card,
          borderColor: selected ? '#1A73E8' : colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Ionicons
        name={icon}
        size={17}
        color={selected ? '#1A73E8' : colors.secondaryText}
      />
      <Text
        style={[
          styles.choiceText,
          { color: selected ? '#1A73E8' : colors.text },
        ]}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={17} color="#1A73E8" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '900' },
  headerCaption: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginTop: 3 },
  topSpacer: { width: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 17, paddingTop: 21, paddingBottom: 35 },
  intro: { marginBottom: 22 },
  pageTitle: { fontSize: 27, fontWeight: '900', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  sectionBlock: { marginBottom: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { fontSize: 12, marginTop: 4, marginBottom: 11 },
  sectionCard: { borderWidth: 1, borderRadius: 19, paddingHorizontal: 14 },
  settingRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '800' },
  rowDetail: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  rowChevron: { marginLeft: 8 },
  inlineAction: { color: '#1A73E8', fontSize: 12, fontWeight: '800' },
  groupLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 10,
  },
  spacedGroup: { marginTop: 20 },
  choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  choice: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  choiceText: { fontSize: 11, fontWeight: '800' },
  helperText: { fontSize: 11, marginTop: 2 },
  preferenceRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 10,
  },
  zoomRow: {
    minHeight: 67,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomInfo: { flex: 1 },
  zoomButton: {
    width: 33,
    height: 33,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomValue: { minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: '800' },
  notice: { fontSize: 11, lineHeight: 16, marginTop: 12, marginBottom: 14 },
  signOutButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  signOutText: { color: '#C2413A', fontSize: 14, fontWeight: '900' },
  footer: { fontSize: 9, textAlign: 'center', letterSpacing: 1, marginTop: 17 },
  modalBackdrop: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 20, 35, 0.58)',
  },
  modalCard: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: '900' },
  modalDescription: { fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 15 },
  modalInput: {
    height: 49,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 5 },
  modalButton: {
    minWidth: 84,
    minHeight: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalPrimary: { backgroundColor: '#1A73E8' },
  modalDelete: { backgroundColor: '#C2413A' },
  modalDeleteDisabled: { opacity: 0.55 },
  modalCancelText: { fontSize: 13, fontWeight: '800' },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
