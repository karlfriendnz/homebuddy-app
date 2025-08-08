import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname === '/';
    return pathname.includes('/settings');
  };

  const handleNavigation = (path: string) => {
    if (path === '/') {
      router.push('/(tabs)');
    } else {
      router.push('/settings');
    }
  };

  return (
    <View style={{
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.neutral[200],
      paddingTop: spacing[2],
      paddingBottom: spacing[3],
      height: spacing[16],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
      {/* Home Tab */}
      <TouchableOpacity
        onPress={() => handleNavigation('/')}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          paddingVertical: spacing[2],
        }}
      >
        <Ionicons 
          name="home" 
          size={24} 
          color={isActive('/') ? colors.primary[500] : colors.neutral[400]} 
        />
        <Text style={[
          componentStyles.textSm,
          componentStyles.fontMedium,
          { marginTop: spacing[1] },
          isActive('/') ? { color: colors.primary[500] } : { color: colors.neutral[400] }
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        onPress={() => handleNavigation('/settings')}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          paddingVertical: spacing[2],
        }}
      >
        <Ionicons 
          name="settings" 
          size={24} 
          color={isActive('/settings') ? colors.primary[500] : colors.neutral[400]} 
        />
        <Text style={[
          componentStyles.textSm,
          componentStyles.fontMedium,
          { marginTop: spacing[1] },
          isActive('/settings') ? { color: colors.primary[500] } : { color: colors.neutral[400] }
        ]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
