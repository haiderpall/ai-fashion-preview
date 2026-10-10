import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from "expo-navigation-bar";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { Colors, darkColors, lightColors } from './colors';

type ThemeContextType = {
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => { },
  setTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const applyNavBarTheme = async () => {
      try {
        //  await NavigationBar.setBackgroundColorAsync(isDark ? darkColors.surface : lightColors.surface);
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      } catch (error) {
        console.warn('Failed to set navigation bar theme:', error);
      }
    };

    applyNavBarTheme();
  }, [isDark]);

  const [isReady, setIsReady] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_is_dark');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'true');
        } else {
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const saveTheme = async (dark: boolean) => {
    setIsDark(dark);
    try {
      await AsyncStorage.setItem('@theme_is_dark', String(dark));
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => saveTheme(!isDark);
  const setTheme = (dark: boolean) => saveTheme(dark);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
