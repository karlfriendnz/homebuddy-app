import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationToken {
  id?: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  created_at?: string;
  updated_at?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions and register for push notifications
   */
  async requestPermissions(userId: string): Promise<boolean> {
    try {
      console.log('🔔 Requesting notification permissions...');
      
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.log('❌ Notifications not supported on simulator/emulator');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions denied');
        return false;
      }

      console.log('✅ Notification permissions granted');

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.log('❌ Failed to get push token');
        return false;
      }

      // Save token to database
      await this.saveTokenToDatabase(userId, token);
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  private async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'a629c147-e210-4a5e-ae1d-f49c0ab64c33', // From app.json
      });
      
      this.token = token.data;
      console.log('📱 Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to database
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const deviceType = Platform.OS as 'ios' | 'android' | 'web';
      
      // Check if token already exists for this user
      const { data: existingToken } = await supabase
        .from('notification_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (existingToken) {
        console.log('✅ Token already exists in database');
        return;
      }

      // Insert new token
      const { error } = await supabase
        .from('notification_tokens')
        .insert([
          {
            user_id: userId,
            token: token,
            device_type: deviceType,
          }
        ]);

      if (error) {
        console.error('❌ Error saving token to database:', error);
        throw error;
      }

      console.log('✅ Token saved to database');
    } catch (error) {
      console.error('❌ Error saving token to database:', error);
      throw error;
    }
  }

  /**
   * Send welcome notification
   */
  async sendWelcomeNotification(userId: string, userName: string): Promise<void> {
    try {
      console.log('🎉 Sending welcome notification...');
      
      // Get user's tokens
      const { data: tokens, error } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user tokens:', error);
        return;
      }

      if (!tokens || tokens.length === 0) {
        console.log('❌ No tokens found for user');
        return;
      }

      // Send notification to all user devices
      const messages = tokens.map(({ token }) => ({
        to: token,
        sound: 'default',
        title: 'Welcome to HomeBuddy! 🏠',
        body: `Hi ${userName}! Your household is ready to go. Start organizing your home life together!`,
        data: { 
          type: 'welcome',
          userId: userId 
        },
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Welcome notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending welcome notification:', error);
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: string): Promise<void> {
    try {
      console.log('🧪 Sending test notification...');
      
      // Get user's tokens
      const { data: tokens, error } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user tokens:', error);
        return;
      }

      if (!tokens || tokens.length === 0) {
        console.log('❌ No tokens found for user');
        return;
      }

      // Send test notification to first device
      const message = {
        to: tokens[0].token,
        sound: 'default',
        title: 'Test Notification 🧪',
        body: 'This is a test notification from HomeBuddy!',
        data: { 
          type: 'test',
          userId: userId 
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([message]),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.token;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 