import { useAuth } from '@/src/lib/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (loading) return;

    hasNavigated.current = true;

    const decideRoute = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          router.replace('/signup');
          return;
        }
      } catch (error) {
        console.error('Error checking launch status:', error);
        // fall through to normal auth-based routing below
      }

      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    };

    decideRoute();
  }, [loading, user, router]);

  // Render nothing — the native splash screen is still visible at this point
  return <View />;
}