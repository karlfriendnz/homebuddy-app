import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { notificationService } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { componentStyles, colors, spacing, borderRadius } from '../styles/global';

interface NotificationPermissionProps {
  onComplete: () => void;
}

export default function NotificationPermission({ onComplete }: NotificationPermissionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Check if notifications are already enabled
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const enabled = await notificationService.areNotificationsEnabled();
    if (enabled) {
      setPermissionGranted(true);
      // If already granted, complete after a short delay
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const requestPermissions = async () => {
    if (!user) {
      console.log('❌ No user found for notification permissions');
      return;
    }

    setLoading(true);
    try {
      const granted = await notificationService.requestPermissions(user.id);
      
      if (granted) {
        setPermissionGranted(true);
        console.log('✅ Notification permissions granted');
        
        // Send welcome notification
        const userName = user.user_metadata?.first_name || 'there';
        await notificationService.sendWelcomeNotification(user.id, userName);
        
        // Complete after a short delay
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your device settings to receive important updates about your household.',
          [
            {
              text: 'Continue',
              onPress: onComplete
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      Alert.alert(
        'Error',
        'There was an issue setting up notifications. You can try again later.',
        [
          {
            text: 'Continue',
            onPress: onComplete
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const skipNotifications = () => {
    Alert.alert(
      'Skip Notifications',
      'You can enable notifications later in your device settings to receive important updates about your household.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          onPress: onComplete
        }
      ]
    );
  };

  if (permissionGranted) {
    return (
      <View style={[componentStyles.screenContainer, componentStyles.justifyCenter, componentStyles.itemsCenter]}>
        <View style={[componentStyles.roundedFull, { 
          backgroundColor: colors.success[100], 
          width: spacing[20], 
          height: spacing[20], 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: spacing[6]
        }]}>
          <Text style={{ fontSize: spacing[10], color: colors.success[500] }}>
            🔔
          </Text>
        </View>
        
        <Text style={[componentStyles.text2xl, componentStyles.fontBold, componentStyles.textPrimary, { marginBottom: spacing[3] }]}>
          Notifications Enabled!
        </Text>
        
        <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', lineHeight: spacing[7] }]}>
          You'll receive important updates about your household activities.
        </Text>
      </View>
    );
  }

  return (
    <View style={[componentStyles.screenContainer, componentStyles.justifyCenter, componentStyles.itemsCenter]}>
      <View style={[componentStyles.roundedFull, { 
        backgroundColor: colors.primary[100], 
        width: spacing[20], 
        height: spacing[20], 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: spacing[6]
      }]}>
        <Text style={{ fontSize: spacing[10], color: colors.primary[500] }}>
          🔔
        </Text>
      </View>
      
      <Text style={[componentStyles.text2xl, componentStyles.fontBold, componentStyles.textPrimary, { marginBottom: spacing[3] }]}>
        Stay Connected
      </Text>
      
      <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', lineHeight: spacing[7], marginBottom: spacing[8] }]}>
        Enable notifications to receive important updates about your household activities, task reminders, and family events.
      </Text>

      <View style={{ width: '100%', maxWidth: 300 }}>
        <TouchableOpacity
          onPress={requestPermissions}
          disabled={loading}
          style={[
            { backgroundColor: colors.primary[500] },
            { padding: spacing[4] },
            { borderRadius: borderRadius.lg },
            componentStyles.itemsCenter,
            { marginBottom: spacing[3] },
            loading && { opacity: 0.5 }
          ]}
        >
          <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
            {loading ? 'Setting Up...' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={skipNotifications}
          disabled={loading}
          style={[
            { backgroundColor: colors.neutral[200] },
            { padding: spacing[4] },
            { borderRadius: borderRadius.lg },
            componentStyles.itemsCenter,
            loading && { opacity: 0.5 }
          ]}
        >
          <Text style={[componentStyles.fontSemibold, componentStyles.textSecondary]}>
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 