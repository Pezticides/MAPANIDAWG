
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

function AppNavigation() {
  const { resolvedTheme } = useSettings();

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
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
