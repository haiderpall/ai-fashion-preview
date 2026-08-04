import {
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/lib/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/src/theme/ThemeContext';
import * as SystemUI from 'expo-system-ui';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'splash',
};

function RootNavigation() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    // Set root background color for system navigation bar matching
    SystemUI.setBackgroundColorAsync(colors.surface);
  }, [colors.surface]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="splash" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceContainerLow } }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-processing" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="preview-result" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootNavigation />
      </AppThemeProvider>
    </AuthProvider>
  );
}
