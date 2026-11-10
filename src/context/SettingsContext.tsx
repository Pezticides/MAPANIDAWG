import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';

export type AppTheme = 'light' | 'dark';
export type AppLanguage = 'en' | 'fil';

type Settings = {
  theme: AppTheme;
  language: AppLanguage;
};

type TranslationKey =
  | 'settings'
  | 'settingsTitle'
  | 'appearance'
  | 'theme'
  | 'light'
  | 'dark'
  | 'language'
  | 'english'
  | 'filipino'
  | 'back';

type SettingsColors = {
  background: string;
  card: string;
  surface: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  selected: string;
};

type SettingsContextValue = Settings & {
  colors: SettingsColors;
  isReady: boolean;
  t: (key: TranslationKey) => string;
  setTheme: (theme: AppTheme) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const STORAGE_KEY = 'ustp_app_settings';
const DEFAULT_SETTINGS: Settings = { theme: 'light', language: 'en' };

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    settings: 'Settings',
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    english: 'English',
    filipino: 'Filipino',
    back: 'Go back',
  },
  fil: {
    settings: 'Mga Setting',
    settingsTitle: 'Mga Setting',
    appearance: 'Hitsura',
    theme: 'Tema',
    light: 'Maliwanag',
    dark: 'Madilim',
    language: 'Wika',
    english: 'Ingles',
    filipino: 'Filipino',
    back: 'Bumalik',
  },
};

function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    (settings.theme === 'light' || settings.theme === 'dark') &&
    (settings.language === 'en' || settings.language === 'fil')
  );
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: React.PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!isSettings(parsed)) {
            throw new Error('Stored settings have an invalid format.');
          }
          if (active) {
            settingsRef.current = parsed;
            setSettings(parsed);
          }
        }
      } catch (error) {
        console.error('Could not load app settings:', error);
        Alert.alert(
          'Could not load settings',
          'Default settings will be used. You can update them again in Settings.'
        );
      } finally {
        if (active) setIsReady(true);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const saveSettings = useCallback(async (next: Settings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    settingsRef.current = next;
    setSettings(next);
  }, []);

  const setTheme = useCallback(
    (theme: AppTheme) => saveSettings({ ...settingsRef.current, theme }),
    [saveSettings]
  );
  const setLanguage = useCallback(
    (language: AppLanguage) =>
      saveSettings({ ...settingsRef.current, language }),
    [saveSettings]
  );

  const colors = useMemo<SettingsColors>(
    () =>
      settings.theme === 'dark'
        ? {
            background: '#101827',
            card: '#1E293B',
            surface: '#29384D',
            text: '#F1F5F9',
            secondaryText: '#A8B5C5',
            mutedText: '#CBD5E1',
            border: '#3A4A5E',
            selected: '#263B5C',
          }
        : {
            background: '#F4F7FB',
            card: '#FFFFFF',
            surface: '#EAF2FF',
            text: '#172B4D',
            secondaryText: '#718096',
            mutedText: '#435267',
            border: '#DCE7F5',
            selected: '#EAF2FF',
          },
    [settings.theme]
  );

  const t = useCallback(
    (key: TranslationKey) => translations[settings.language][key],
    [settings.language]
  );

  const value = useMemo(
    () => ({
      ...settings,
      colors,
      isReady,
      t,
      setTheme,
      setLanguage,
    }),
    [settings, colors, isReady, t, setTheme, setLanguage]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider.');
  }
  return context;
}
