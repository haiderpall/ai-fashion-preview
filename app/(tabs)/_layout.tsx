import { useAuth } from '@/src/lib/auth-context';
import { useTheme } from '@/src/theme/ThemeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { History, Home, Settings, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.outlineVariant,
          borderBottomWidth: 1,
        },
        headerTitleAlign: 'left',
        headerShadowVisible: true,

        headerTitle: () => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome6
              name="bag-shopping"
              size={20}
              color={colors.primary}
            />

            <Text
              style={{
                marginLeft: 8,
                fontSize: 18,
                fontWeight: '700',
                color: colors.onSurface,
              }}
            >
              AI Fashion Preview
            </Text>
          </View>
        ),

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}