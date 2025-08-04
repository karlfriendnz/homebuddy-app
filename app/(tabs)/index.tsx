import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentStyles, colors, spacing } from '../../styles/global';
import { trackScreen } from '@/lib/posthog';
import { useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ fromOnboarding?: string }>();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    // Track screen view when component mounts
    trackScreen('Home Screen');
  }, []);

  useEffect(() => {
    // Show welcome popup if coming from onboarding
    if (params.fromOnboarding === 'true' && !hasShownWelcome) {
      setHasShownWelcome(true);
      Alert.alert(
        'Welcome to HomeBuddy! 🏠',
        'Your household is now set up and ready to go. Start organizing your home life together!',
        [
          {
            text: 'Get Started',
            style: 'default'
          }
        ]
      );
    }
  }, [params.fromOnboarding, hasShownWelcome]);

  return (
    <View style={componentStyles.screenContainer}>
      <View style={[componentStyles.flex1, componentStyles.justifyCenter, componentStyles.itemsCenter]}>
        <View style={[componentStyles.roundedFull, { 
          backgroundColor: colors.primary[100], 
          width: spacing[20], 
          height: spacing[20], 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: spacing[6]
        }]}>
          <Ionicons name="home" size={spacing[10]} color={colors.primary[500]} />
        </View>
        
        <Text style={[componentStyles.text3xl, componentStyles.fontBold, componentStyles.textPrimary, { marginBottom: spacing[3] }]}>
          Welcome to HomeBuddy!
        </Text>
        
        <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', lineHeight: spacing[7] }]}>
          Your household is now set up and ready to go. Start organizing your home life together!
        </Text>
      </View>
    </View>
  );
}
