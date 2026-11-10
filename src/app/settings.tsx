import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type AppLanguage,
  type AppTheme,
  useSettings,
} from '../context/SettingsContext';

export default function SettingsScreen() {
  const { colors, isReady, language, setLanguage, setTheme, t, theme } =
    useSettings();
  const [saving, setSaving] = useState(false);

  async function updateSetting(update: () => Promise<void>) {
    setSaving(true);
    try {
      await update();
    } catch (error) {
      console.error('Could not save app settings:', error);
      Alert.alert(
        'Could not save settings',
        'Please check your device storage and try again.'
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

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.topBar, { backgroundColor: colors.card }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          accessibilityLabel={t('back')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>
          {t('settingsTitle')}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      {!isReady ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('appearance')}
          </Text>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.label, { color: colors.secondaryText }]}>
              {t('theme')}
            </Text>
            <View style={styles.options}>
              <Option
                label={t('light')}
                icon="sunny-outline"
                selected={theme === 'light'}
                disabled={saving}
                colors={colors}
                onPress={() => chooseTheme('light')}
              />
              <Option
                label={t('dark')}
                icon="moon-outline"
                selected={theme === 'dark'}
                disabled={saving}
                colors={colors}
                onPress={() => chooseTheme('dark')}
              />
            </View>

            <Text style={[styles.label, styles.languageLabel, { color: colors.secondaryText }]}>
              {t('language')}
            </Text>
            <View style={styles.options}>
              <Option
                label={t('english')}
                icon="language-outline"
                selected={language === 'en'}
                disabled={saving}
                colors={colors}
                onPress={() => chooseLanguage('en')}
              />
              <Option
                label={t('filipino')}
                icon="language-outline"
                selected={language === 'fil'}
                disabled={saving}
                colors={colors}
                onPress={() => chooseLanguage('fil')}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Option({
  label,
  icon,
  selected,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useSettings>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.selected : colors.card,
          borderColor: selected ? '#1A73E8' : colors.border,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? '#1A73E8' : colors.secondaryText}
      />
      <Text
        style={[
          styles.optionText,
          { color: selected ? '#1A73E8' : colors.text },
        ]}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={19} color="#1A73E8" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '900' },
  topSpacer: { width: 38 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 17 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  section: { borderWidth: 1, borderRadius: 18, padding: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  languageLabel: { marginTop: 22 },
  options: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: { flex: 1, fontSize: 13, fontWeight: '700' },
});
