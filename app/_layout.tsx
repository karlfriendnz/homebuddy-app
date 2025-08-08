import { Stack, useRouter, useSegments } from 'expo-router';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { View } from 'react-native';
import { posthog } from '../lib/posthog';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { householdUtils } from '../lib/supabase-utils';
import '../global.css';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('🔍 Routing Debug:', { 
      user: !!user, 
      loading, 
      segments, 
      inAuthGroup, 
      inTabsGroup,
      currentPath: segments.join('/')
    });

    // TEMPORARILY DISABLED: Auth routing logic to fix login loop
    // Only redirect unauthenticated users away from protected routes
    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth group, redirect to login
      console.log('🔄 Redirecting unauthenticated user to login');
      router.replace('/(auth)/login');
    }
    
    // TODO: Re-enable auth routing logic after fixing the loop issue
    /*
    else if (user && inAuthGroup) {
      // User is authenticated but in auth group, check if they need to set up household
      if (segments[1] === 'verify-email') {
        // User is on verification screen, don't redirect
        return;
      }
      
      // Allow login page to be accessed even when authenticated (for sign out functionality)
      if (segments[1] === 'login') {
        // User is on login page, don't redirect
        return;
      }
      
      // Allow family setup screen to be accessed during onboarding
      if (segments[1] === 'onboarding' && segments[2] === 'family-setup') {
        // User is on family setup screen, don't redirect
        return;
      }
      
      // Check if user has a household
      const checkHouseholdAndRedirect = async () => {
        try {
          const hasHousehold = await householdUtils.userHasHousehold(user.id);
          
          if (hasHousehold && segments[1] !== 'onboarding') {
            // User has a household and not in onboarding, redirect to main app
            router.replace('/(tabs)');
          } else if (!hasHousehold && segments[1] !== 'onboarding') {
            // User doesn't have a household and not already on household choice, redirect there
            router.replace('/(auth)/onboarding/household-choice');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error checking household membership:', error);
          // On error, redirect to household choice as fallback
          if (segments[1] !== 'onboarding') {
            router.replace('/(auth)/onboarding/household-choice');
          }
        }
      };
      
      checkHouseholdAndRedirect();
    }
    */
  }, [user, loading, segments, router]);

  if (loading) {
    // Show loading screen while auth is checking
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <PostHogProvider client={posthog as any || undefined}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PostHogProvider>
    </View>
  );
}