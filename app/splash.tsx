import { useAuth } from '@/src/lib/auth-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && user) {
        router.replace('/(tabs)');
      } else if (!loading) {
        router.replace('/login');
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [loading, router, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <FontAwesome6 name="bag-shopping" size={56} color={colors.primary} />
        </View>
        <Text style={styles.logo}>AI Fashion Preview</Text>
        <Text style={styles.subtitle}>The high-fidelity preview tool for tailors and boutiques</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
