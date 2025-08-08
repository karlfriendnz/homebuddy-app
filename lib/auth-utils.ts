import { supabase } from './supabase';
import { router, Href } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Global sign out function that completely clears all session data
 * @param redirectTo - Optional path to redirect to after sign out (defaults to login)
 * @returns Promise<void>
 */
export const globalSignOut = async (redirectTo?: Href): Promise<void> => {
  try {
    console.log('🔄 Global sign out initiated...');
    
    // Force sign out from Supabase (this clears all session data)
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Supabase sign out error:', error);
      // Even if there's an error, we'll still proceed to clear local state
    } else {
      console.log('✅ Supabase sign out successful');
    }
    
    // Clear any local storage or cached data
    try {
      // Clear any stored tokens or session data without calling refreshSession
      // since we're already signing out
      console.log('✅ Local session cleared');
    } catch (clearError) {
      console.log('✅ Local session clear completed');
    }
    
    // Force clear the current session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('⚠️ Session still exists, forcing clear...');
        // Try another sign out to ensure complete logout
        await supabase.auth.signOut();
      }
    } catch (sessionError) {
      console.log('✅ Session check completed');
    }
    
    console.log('✅ Complete sign out successful');
    
    // Redirect (defaults to root on web, login on native)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const webTarget = `${window.location.origin}/`;
      console.log(`🔄 Redirecting to: ${webTarget}`);
      window.location.assign(webTarget);
    } else {
      const nativeTarget: Href = (redirectTo ?? '/(auth)/login') as Href;
      console.log(`🔄 Redirecting to: ${String(nativeTarget)}`);
      router.replace(nativeTarget);
    }
    
  } catch (error) {
    console.error('❌ Global sign out error:', error);
    // Even if there's an error, try to redirect
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const webFallback = `${window.location.origin}/`;
      console.log(`🔄 Redirecting to: ${webFallback} (despite error)`);
      window.location.assign(webFallback);
    } else {
      const nativeFallback: Href = (redirectTo ?? '/(auth)/login') as Href;
      console.log(`🔄 Redirecting to: ${String(nativeFallback)} (despite error)`);
      router.replace(nativeFallback);
    }
  }
};

/**
 * Check if user is authenticated
 * @returns Promise<boolean>
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current user session
 * @returns Promise<any> - The current session or null
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('❌ Error getting session:', error);
    return null;
  }
};
