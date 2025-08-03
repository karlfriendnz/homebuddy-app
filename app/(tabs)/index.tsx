import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentStyles, colors, spacing } from '../../styles/global';
import { trackScreen } from '@/lib/posthog';

export default function HomeScreen() {
  useEffect(() => {
    // Track screen view when component mounts
    trackScreen('Home Screen');
  }, []);

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
