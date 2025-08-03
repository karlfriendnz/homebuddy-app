
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, componentStyles, spacing, borderRadius, typography, constants } from '../../styles/global';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function AuthHeader({
  title,
  subtitle,
  icon = 'home',
  iconColor = colors.primary[500],
}: AuthHeaderProps) {
  return (
    <View style={[componentStyles.itemsCenter, componentStyles.mb6]}>
      <View style={[
        componentStyles.itemsCenter,
        componentStyles.justifyCenter,
        {
          width: spacing[20],
          height: spacing[20],
          borderRadius: borderRadius.full,
          backgroundColor: colors.neutral[100],
          marginBottom: spacing[6],
        }
      ]}>
        <Ionicons name={icon} size={constants.size.icon.xlarge} color={iconColor} />
      </View>
      <Text style={[componentStyles.text3xl, componentStyles.fontBold, componentStyles.textPrimary, componentStyles.mb2]}>
        {title}
      </Text>
      <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', lineHeight: typography.size['2xl'] }]}>
        {subtitle}
      </Text>
    </View>
  );
} 