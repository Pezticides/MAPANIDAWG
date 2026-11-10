import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  SettingsProvider,
  useSettings,
} from '../context/SettingsContext';

function AppNavigation() {
  const { theme, colors } = useSettings();

  return (
    <>
      <StatusBar
        style={theme === 'dark' ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppNavigation />
    </SettingsProvider>
  );
}