import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { componentStyles, colors, spacing } from '../../styles/global';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={[componentStyles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>
          Loading...
        </Text>
      </View>
    );
  }

  // If user is not authenticated, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated, render children
  return <View style={{ flex: 1 }}>{children}</View>;
}
