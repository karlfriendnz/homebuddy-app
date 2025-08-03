import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { componentStyles } from '../styles/global';

export default function Index() {
  useEffect(() => {
    // Redirect to login screen
    router.replace('/login');
  }, []);

  return (
    <View style={[componentStyles.authContainer, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={[componentStyles.textLg, componentStyles.textSecondary]}>Loading...</Text>
    </View>
  );
} 