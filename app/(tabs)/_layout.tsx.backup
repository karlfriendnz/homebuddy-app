import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, componentStyles } from '../../styles/global';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function TabLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.replace('/login');
    }
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.neutral[200],
          paddingTop: spacing[2],
          paddingBottom: spacing[3],
          height: spacing[16],
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          ...componentStyles.textLg,
          ...componentStyles.fontSemibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 