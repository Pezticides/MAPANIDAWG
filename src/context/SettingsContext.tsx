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
import { Alert, useColorScheme } from 'react-native';

export type AppTheme = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'fil';
export type MapType = 'standard' | 'satellite';

export type MapPreferences = {
  mapType: MapType;
  showMarkers: boolean;
  showCurrentLocation: boolean;
  defaultZoom: number;
  navigationMode: 'walking';
};

export type NotificationPreferences = {
  campusAnnouncements: boolean;
  facilityUpdates: boolean;
  eventNotifications: boolean;
  maintenanceAnnouncements: boolean;
  appUpdates: boolean;
};

type Settings = {
  theme: AppTheme;
  language: AppLanguage;
  mapPreferences: MapPreferences;
  notifications: NotificationPreferences;
};

type TranslationKey =
  | 'settings'
  | 'settingsTitle'
  | 'appearance'
  | 'theme'
  | 'light'
  | 'dark'
  | 'system'
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
  resolvedTheme: 'light' | 'dark';
  t: (key: TranslationKey) => string;
  setTheme: (theme: AppTheme) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  updateMapPreferences: (preferences: Partial<MapPreferences>) => Promise<void>;
  updateNotifications: (
    notifications: Partial<NotificationPreferences>
  ) => Promise<void>;
};

const STORAGE_KEY = 'ustp_app_settings';
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  mapPreferences: {
    mapType: 'standard',
    showMarkers: true,
    showCurrentLocation: true,
    defaultZoom: 17,
    navigationMode: 'walking',
  },
  notifications: {
    campusAnnouncements: true,
    facilityUpdates: true,
    eventNotifications: true,
    maintenanceAnnouncements: true,
    appUpdates: false,
  },
};

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    settings: 'Settings',
    settingsTitle: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
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
    system: 'Sistema',
    language: 'Wika',
    english: 'Ingles',
    filipino: 'Filipino',
    back: 'Bumalik',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readSettings(value: unknown): Settings {
  if (!isRecord(value)) {
    throw new Error('Stored settings have an invalid format.');
  }

  const theme = value.theme;
  const language = value.language;

  if (
    (theme !== 'light' && theme !== 'dark' && theme !== 'system') ||
    (language !== 'en' && language !== 'fil')
  ) {
    throw new Error('Stored settings have an invalid format.');
  }

  const storedMap = isRecord(value.mapPreferences)
    ? value.mapPreferences
    : {};
  const storedNotifications = isRecord(value.notifications)
    ? value.notifications
    : {};
  const defaultZoom = storedMap.defaultZoom;

  return {
    theme,
    language,
    mapPreferences: {
      mapType:
        storedMap.mapType === 'satellite' ? 'satellite' : 'standard',
      showMarkers:
        typeof storedMap.showMarkers === 'boolean'
          ? storedMap.showMarkers
          : DEFAULT_SETTINGS.mapPreferences.showMarkers,
      showCurrentLocation:
        typeof storedMap.showCurrentLocation === 'boolean'
          ? storedMap.showCurrentLocation
          : DEFAULT_SETTINGS.mapPreferences.showCurrentLocation,
      defaultZoom:
        typeof defaultZoom === 'number' && defaultZoom >= 13 && defaultZoom <= 20
          ? defaultZoom
          : DEFAULT_SETTINGS.mapPreferences.defaultZoom,
      navigationMode: 'walking',
    },
    notifications: {
      campusAnnouncements:
        typeof storedNotifications.campusAnnouncements === 'boolean'
          ? storedNotifications.campusAnnouncements
          : DEFAULT_SETTINGS.notifications.campusAnnouncements,
      facilityUpdates:
        typeof storedNotifications.facilityUpdates === 'boolean'
          ? storedNotifications.facilityUpdates
          : DEFAULT_SETTINGS.notifications.facilityUpdates,
      eventNotifications:
        typeof storedNotifications.eventNotifications === 'boolean'
          ? storedNotifications.eventNotifications
          : DEFAULT_SETTINGS.notifications.eventNotifications,
      maintenanceAnnouncements:
        typeof storedNotifications.maintenanceAnnouncements === 'boolean'
          ? storedNotifications.maintenanceAnnouncements
          : DEFAULT_SETTINGS.notifications.maintenanceAnnouncements,
      appUpdates:
        typeof storedNotifications.appUpdates === 'boolean'
          ? storedNotifications.appUpdates
          : DEFAULT_SETTINGS.notifications.appUpdates,
    },
  };
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: React.PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const settingsRef = useRef(settings);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = readSettings(JSON.parse(stored) as unknown);
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
  const updateMapPreferences = useCallback(
    (preferences: Partial<MapPreferences>) =>
      saveSettings({
        ...settingsRef.current,
        mapPreferences: {
          ...settingsRef.current.mapPreferences,
          ...preferences,
        },
      }),
    [saveSettings]
  );
  const updateNotifications = useCallback(
    (notifications: Partial<NotificationPreferences>) =>
      saveSettings({
        ...settingsRef.current,
        notifications: {
          ...settingsRef.current.notifications,
          ...notifications,
        },
      }),
    [saveSettings]
  );

  const resolvedTheme =
    settings.theme === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings.theme;

  const colors = useMemo<SettingsColors>(
    () =>
      resolvedTheme === 'dark'
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
    [resolvedTheme]
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
      resolvedTheme,
      t,
      setTheme,
      setLanguage,
      updateMapPreferences,
      updateNotifications,
    }),
    [
      settings,
      colors,
      isReady,
      resolvedTheme,
      t,
      setTheme,
      setLanguage,
      updateMapPreferences,
      updateNotifications,
    ]
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
