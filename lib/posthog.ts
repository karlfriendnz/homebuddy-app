import { PostHog } from 'posthog-react-native';
import { Platform } from 'react-native';

// Initialize PostHog instance only in browser environment
let posthog: PostHog | null = null;

if (Platform.OS === 'web') {
  // Only initialize PostHog in browser environment when window is available
  if (typeof window !== 'undefined') {
    try {
      posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY || '', {
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      });
    } catch (error) {
      console.warn('Failed to initialize PostHog:', error);
    }
  }
} else {
  // For native platforms, initialize normally
  try {
    posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY || '', {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    });
  } catch (error) {
    console.warn('Failed to initialize PostHog:', error);
  }
}

// Common tracking functions with safety checks
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  if (posthog) {
    posthog.capture(event, properties);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (posthog) {
    posthog.identify(userId, properties);
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (posthog) {
    // Use identify with properties instead of set
    posthog.identify(undefined, properties);
  }
};

export const resetUser = () => {
  if (posthog) {
    posthog.reset();
  }
};

// Screen tracking helper
export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  if (posthog) {
    posthog.capture('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }
};

// Feature flag helper
export const getFeatureFlag = async (flagKey: string, defaultValue?: any) => {
  if (!posthog) {
    return defaultValue;
  }
  
  try {
    return await posthog.getFeatureFlag(flagKey) || defaultValue;
  } catch (error) {
    console.warn(`Failed to get feature flag ${flagKey}:`, error);
    return defaultValue;
  }
};

// Export posthog instance for direct access if needed
export { posthog }; 