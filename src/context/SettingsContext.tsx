import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'fil' | 'ceb';

type SettingsContextType = {
  theme: ThemeMode;
  language: Language;
  colors: {
    background: string;
    card: string;
    text: string;
    secondary: string;
    border: string;
    primary: string;
  };
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    chooseTheme: 'Choose your preferred theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    chooseLanguage: 'Choose your preferred language',
    english: 'English',
    filipino: 'Filipino',
    cebuano: 'Cebuano (Bisaya)',
    back: 'Back',
    campusMap: 'Campus Map',
    explore: 'Explore Buildings',
    categories: 'Categories',
    saved: 'Saved Locations',
    about: 'About USTP',
    signOut: 'Sign Out',
    search: 'Search campus locations',
    searchSaved: 'Search saved locations',
    noResults: 'No locations found.',
    yourLocation: 'Your location',
  },

  fil: {
    settings: 'Mga Setting',
    appearance: 'Hitsura',
    chooseTheme: 'Piliin ang iyong gustong tema',
    lightMode: 'Maliwanag na Mode',
    darkMode: 'Madilim na Mode',
    language: 'Wika',
    chooseLanguage: 'Piliin ang iyong gustong wika',
    english: 'Ingles',
    filipino: 'Filipino',
    cebuano: 'Cebuano (Bisaya)',
    back: 'Bumalik',
    campusMap: 'Mapa ng Kampus',
    explore: 'Mga Gusali',
    categories: 'Mga Kategorya',
    saved: 'Mga Naka-save na Lokasyon',
    about: 'Tungkol sa USTP',
    signOut: 'Mag-sign Out',
    search: 'Maghanap ng mga lugar sa kampus',
    searchSaved: 'Maghanap ng mga naka-save na lugar',
    noResults: 'Walang nakitang lokasyon.',
    yourLocation: 'Iyong lokasyon',
  },

  ceb: {
    settings: 'Mga Setting',
    appearance: 'Hitsura',
    chooseTheme: 'Pilia ang imong gustong tema',
    lightMode: 'Hayag nga Mode',
    darkMode: 'Ngitngit nga Mode',
    language: 'Pinulongan',
    chooseLanguage: 'Pilia ang imong gustong pinulongan',
    english: 'English',
    filipino: 'Filipino',
    cebuano: 'Cebuano (Bisaya)',
    back: 'Balik',
    campusMap: 'Mapa sa Kampus',
    explore: 'Mga Building',
    categories: 'Mga Kategorya',
    saved: 'Mga Gitipig nga Lokasyon',
    about: 'Mahitungod sa USTP',
    signOut: 'Gawas',
    search: 'Pangita og mga lugar sa kampus',
    searchSaved: 'Pangita og mga gitipig nga lugar',
    noResults: 'Walay nakit-an nga lokasyon.',
    yourLocation: 'Imong lokasyon',
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        const savedLanguage = await AsyncStorage.getItem('app_language');

        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }

        if (
          savedLanguage === 'en' ||
          savedLanguage === 'fil' ||
          savedLanguage === 'ceb'
        ) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoaded(true);
      }
    }

    loadSettings();
  }, []);

  async function setTheme(value: ThemeMode) {
    setThemeState(value);

    try {
      await AsyncStorage.setItem('app_theme', value);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  async function setLanguage(value: Language) {
    setLanguageState(value);

    try {
      await AsyncStorage.setItem('app_language', value);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  const colors = theme === 'dark'
    ? {
        background: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        secondary: '#B0B0B0',
        border: '#383838',
        primary: '#64A9FF',
      }
    : {
        background: '#F4F7FB',
        card: '#FFFFFF',
        text: '#172B4D',
        secondary: '#718096',
        border: '#E1E7EF',
        primary: '#1A73E8',
      };

  function t(key: string) {
    return translations[language][key] ?? key;
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        colors,
        setTheme,
        setLanguage,
        t,
      }}
    >
      {loaded && children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      'useSettings must be used inside SettingsProvider'
    );
  }

  return context;
}