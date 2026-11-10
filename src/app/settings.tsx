
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    useSettings
} from '../context/SettingsContext';

export default function SettingsScreen() {
  const {
    theme,
    language,
    colors,
    setTheme,
    setLanguage,
    t,
  } = useSettings();

  function Option({
    label,
    selected,
    onPress,
    icon,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon: keyof typeof Ionicons.glyphMap;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.option,
          {
            backgroundColor: selected
              ? theme === 'dark'
                ? '#263D57'
                : '#EAF2FF'
              : colors.card,
            borderColor: selected
              ? colors.primary
              : colors.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={colors.primary}
        />

        <Text
          style={[
            styles.optionText,
            { color: colors.text },
          ]}
        >
          {label}
        </Text>

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.primary}
          />
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      edges={['top']}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={colors.text}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          {t('settings')}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* APPEARANCE */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={24}
              color={colors.primary}
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              {t('appearance')}
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              { color: colors.secondary },
            ]}
          >
            {t('chooseTheme')}
          </Text>

          <Option
            label={t('lightMode')}
            icon="sunny-outline"
            selected={theme === 'light'}
            onPress={() => setTheme('light')}
          />

          <Option
            label={t('darkMode')}
            icon="moon-outline"
            selected={theme === 'dark'}
            onPress={() => setTheme('dark')}
          />
        </View>

        {/* LANGUAGE */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="language-outline"
              size={24}
              color={colors.primary}
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              {t('language')}
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              { color: colors.secondary },
            ]}
          >
            {t('chooseLanguage')}
          </Text>

          <Option
            label="English"
            icon="globe-outline"
            selected={language === 'en'}
            onPress={() => setLanguage('en')}
          />

          <Option
            label="Filipino"
            icon="globe-outline"
            selected={language === 'fil'}
            onPress={() => setLanguage('fil')}
          />

          <Option
            label="Cebuano (Bisaya)"
            icon="globe-outline"
            selected={language === 'ceb'}
            onPress={() => setLanguage('ceb')}
          />
        </View>

        <Text
          style={[
            styles.footer,
            { color: colors.secondary },
          ]}
        >
          USTP Campus Navigator
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  section: {
    padding: 18,
    borderRadius: 17,
    marginBottom: 20,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  description: {
    fontSize: 13,
    marginBottom: 15,
  },

  option: {
    minHeight: 57,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
  },
});