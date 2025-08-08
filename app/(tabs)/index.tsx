import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentStyles, colors, spacing, borderRadius } from '../../styles/global';
import { trackScreen } from '../../lib/posthog';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../lib/notifications';
import NotificationPermission from '../../components/NotificationPermission';
import BottomNavigation from '../../components/ui/BottomNavigation';
import AuthGuard from '../../components/auth/AuthGuard';
import * as Notifications from 'expo-notifications';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ fromOnboarding?: string; setupComplete?: string; setupSkipped?: string }>();
  const { user } = useAuth();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);
  const [hasShownNotificationRequest, setHasShownNotificationRequest] = useState(false);

  useEffect(() => {
    // Track screen view when component mounts
    trackScreen('Home Screen');

    // Set up notification listener
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    // Track when user arrives from onboarding (no alert)
    if (params.fromOnboarding === 'true' && !hasShownWelcome) {
      setHasShownWelcome(true);
      console.log('🏠 User arrived from onboarding flow');
      
      // Show notification permission request after a delay
      setTimeout(() => {
        setShowNotificationPermission(true);
      }, 2000);
    }
  }, [params.fromOnboarding, hasShownWelcome]);

  const handleNotificationComplete = () => {
    setShowNotificationPermission(false);
    setHasShownNotificationRequest(true);
  };

  const sendTestNotification = async () => {
    if (!user) return;
    
    try {
      await notificationService.sendTestNotification(user.id);
      Alert.alert('Test Notification', 'Test notification sent! Check your device.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  // Show notification permission request if needed
  if (showNotificationPermission) {
    return <NotificationPermission onComplete={handleNotificationComplete} />;
  }

  return (
    <AuthGuard>
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
          
          <Text style={[componentStyles.textLg, componentStyles.textSecondary, { textAlign: 'center', lineHeight: spacing[7], marginBottom: spacing[6] }]}>
            Your household is now set up and ready to go. Start organizing your home life together!
          </Text>

          {/* Test Notification Button */}
          {hasShownNotificationRequest && (
            <TouchableOpacity
              onPress={sendTestNotification}
              style={[
                { backgroundColor: colors.warning[500] },
                { paddingHorizontal: spacing[4] },
                { paddingVertical: spacing[3] },
                { borderRadius: borderRadius.lg },
                componentStyles.itemsCenter
              ]}
            >
              <Text style={[componentStyles.fontSemibold, componentStyles.textInverse]}>
                🧪 Send Test Notification
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Bottom Navigation */}
        <BottomNavigation />
      </View>
    </AuthGuard>
  );
}
