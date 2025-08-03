import { Platform } from 'react-native';

// Define a simple PostHog interface
interface PostHogInterface {
  capture: (event: string, properties?: Record<string, any>) => void;
  identify: (userId?: string, properties?: Record<string, any>) => void;
  reset: () => void;
  getFeatureFlag: (flagKey: string) => Promise<any>;
}

// Initialize PostHog instance only in browser environment
let posthog: PostHogInterface | null = null;

if (Platform.OS === 'web') {
  // Only initialize PostHog in browser environment when window is available
  if (typeof window !== 'undefined') {
    try {
      // For now, let's create a mock PostHog instance to avoid initialization issues
      posthog = {
        capture: (event: string, properties?: Record<string, any>) => {
          console.log('PostHog track:', event, properties);
        },
        identify: (userId?: string, properties?: Record<string, any>) => {
          console.log('PostHog identify:', userId, properties);
        },
        reset: () => {
          console.log('PostHog reset');
        },
        getFeatureFlag: async (flagKey: string) => {
          console.log('PostHog getFeatureFlag:', flagKey);
          return null;
        }
      };
    } catch (error) {
      console.warn('Failed to initialize PostHog:', error);
    }
  }
} else {
  // For native platforms, create a mock instance for now
  posthog = {
    capture: (event: string, properties?: Record<string, any>) => {
      console.log('PostHog track:', event, properties);
    },
    identify: (userId?: string, properties?: Record<string, any>) => {
      console.log('PostHog identify:', userId, properties);
    },
    reset: () => {
      console.log('PostHog reset');
    },
    getFeatureFlag: async (flagKey: string) => {
      console.log('PostHog getFeatureFlag:', flagKey);
      return null;
    }
  };
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