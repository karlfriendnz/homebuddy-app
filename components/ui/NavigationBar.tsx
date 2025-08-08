import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';

interface NavigationBarProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
}

export default function NavigationBar({ 
  showBackButton = false, 
  title, 
  onBackPress 
}: NavigationBarProps) {
  const pathname = usePathname();
  
  // Auto-detect if we're in a sub-page that needs a back button
  const isSubPage = pathname.includes('/settings/') && pathname !== '/(tabs)/settings';
  const shouldShowBackButton = showBackButton || isSubPage;
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/(tabs)' || pathname === '/(tabs)/';
    return pathname.includes(path);
  };

  const handleNavigation = (path: string) => {
    if (path === '/') {
      router.push('/(tabs)');
    } else {
      router.push(path);
    }
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getPageTitle = (path: string) => {
    if (path.includes('/settings/household')) return 'Household Settings';
    if (path.includes('/settings/profile')) return 'Profile Settings';
    return '';
  };

  return (
    <View style={{
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral[200],
      paddingTop: spacing[4],
      paddingBottom: spacing[4],
      paddingHorizontal: spacing[6],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Left side - Back button or title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {shouldShowBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            style={{
              padding: spacing[2],
              borderRadius: borderRadius.sm,
              backgroundColor: colors.neutral[100],
              marginRight: spacing[3],
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
        
        {(title || isSubPage) && (
          <Text style={[
            componentStyles.textXl,
            componentStyles.fontBold,
            componentStyles.textPrimary,
          ]}>
            {title || (isSubPage ? getPageTitle(pathname) : '')}
          </Text>
        )}
      </View>

      {/* Center - Navigation tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.neutral[100],
        borderRadius: borderRadius.lg,
        padding: spacing[1],
      }}>
        {/* Home Tab */}
        <TouchableOpacity
          onPress={() => handleNavigation('/')}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[4],
              borderRadius: borderRadius.md,
              minWidth: 80,
              justifyContent: 'center',
            },
            isActive('/') && {
              backgroundColor: colors.primary[500],
            }
          ]}
        >
          <Ionicons 
            name="home" 
            size={20} 
            color={isActive('/') ? colors.text.inverse : colors.neutral[600]} 
          />
          <Text style={[
            componentStyles.textSm,
            componentStyles.fontMedium,
            { marginLeft: spacing[2] },
            isActive('/') ? { color: colors.text.inverse } : { color: colors.neutral[600] }
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity
          onPress={() => handleNavigation('/settings')}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[4],
              borderRadius: borderRadius.md,
              minWidth: 80,
              justifyContent: 'center',
            },
            isActive('/settings') && {
              backgroundColor: colors.primary[500],
            }
          ]}
        >
          <Ionicons 
            name="settings" 
            size={20} 
            color={isActive('/settings') ? colors.text.inverse : colors.neutral[600]} 
          />
          <Text style={[
            componentStyles.textSm,
            componentStyles.fontMedium,
            { marginLeft: spacing[2] },
            isActive('/settings') ? { color: colors.text.inverse } : { color: colors.neutral[600] }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right side - Empty for balance */}
      <View style={{ flex: 1 }} />
    </View>
  );
}
