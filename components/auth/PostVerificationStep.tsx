import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentStyles, colors, spacing } from '../../styles/global';

export function PostVerificationStep() {
  return (
    <View style={componentStyles.flex1}>
      <View style={[componentStyles.itemsCenter, { marginBottom: spacing[6] }]}>
        <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary[500]} />
      </View>
      <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center' }]}>
        Email verified! Setting up your account...
      </Text>
    </View>
  );
} 