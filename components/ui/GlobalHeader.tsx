import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';

interface GlobalHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHelp?: boolean;
  onBackPress?: () => void;
  onHelpPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function GlobalHeader({
  title,
  showBackButton = true,
  showHelp = true,
  onBackPress,
  onHelpPress,
  rightComponent
}: GlobalHeaderProps) {
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Default back behavior
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)');
      }
    }
  };

  const handleHelpPress = () => {
    if (onHelpPress) {
      onHelpPress();
    } else {
      // Default help behavior - could open a help modal or navigate to help page
      // console.log('Help pressed');
    }
  };

  return (
    <View style={{
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral[200],
      paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'web' ? 12 : 20, // Safe area for iOS, 12px for web
      paddingBottom: 12, // 12px bottom padding
      paddingHorizontal: spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: Platform.OS === 'ios' ? 90 : Platform.OS === 'web' ? 60 : 60,
      ...Platform.select({
        web: {
          position: 'sticky' as any,
          top: 0,
          zIndex: 1000,
        }
      })
    }}>
      {/* Left Section - Back Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              padding: spacing[2],
              marginRight: spacing[3],
              borderRadius: borderRadius.md,
              backgroundColor: colors.neutral[100],
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.neutral[600]} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Section - Title */}
      <View style={{ flex: 2, alignItems: 'center' }}>
        <Text style={[
          componentStyles.textLg,
          componentStyles.fontSemibold,
          { 
            color: colors.text.primary,
            textAlign: 'center',
            maxWidth: '100%',
          }
        ]}>
          {title}
        </Text>
      </View>

      {/* Right Section - Help Button and Custom Component */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
        {rightComponent}
        {showHelp && (
          <TouchableOpacity
            onPress={handleHelpPress}
            style={{
              padding: spacing[2],
              marginLeft: spacing[2],
              borderRadius: borderRadius.md,
              backgroundColor: colors.neutral[100],
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="help-circle-outline" 
              size={24} 
              color={colors.neutral[600]} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
