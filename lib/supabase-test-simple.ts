// Simple test to verify Supabase configuration
export const testSupabaseConfig = () => {
  console.log('🧪 Testing Supabase configuration...');
  
  // Check environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  
  console.log('Environment variables:');
  console.log('- Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.log('- Supabase Key:', supabaseKey ? '✅ Present' : '❌ Missing');
  console.log('- PostHog Key:', posthogKey ? '✅ Present' : '❌ Missing');
  console.log('- PostHog Host:', posthogHost ? '✅ Present' : '❌ Missing');
  
  const allPresent = !!(supabaseUrl && supabaseKey && posthogKey && posthogHost);
  
  if (allPresent) {
    console.log('✅ All environment variables are configured correctly');
  } else {
    console.log('❌ Some environment variables are missing');
  }
  
  return allPresent;
};

// Test the Supabase client creation
export const testSupabaseClient = async () => {
  try {
    // Dynamic import to avoid React Native issues
    const { supabase } = await import('./supabase');
    
    console.log('✅ Supabase client created successfully');
    console.log('Client URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('Client configured for:', process.env.EXPO_PUBLIC_ENVIRONMENT || 'development');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return false;
  }
};

// Run configuration tests
export const runConfigTests = async () => {
  console.log('🚀 Running Supabase configuration tests...\n');
  
  const envTest = testSupabaseConfig();
  const clientTest = await testSupabaseClient();
  
  console.log('\n📊 Test Results:');
  console.log('Environment Variables:', envTest ? '✅' : '❌');
  console.log('Client Creation:', clientTest ? '✅' : '❌');
  
  const allPassed = envTest && clientTest;
  
  if (allPassed) {
    console.log('\n🎉 Supabase configuration is ready!');
  } else {
    console.log('\n⚠️  Configuration issues detected.');
  }
  
  return allPassed;
};

export default {
  testSupabaseConfig,
  testSupabaseClient,
  runConfigTests
}; 