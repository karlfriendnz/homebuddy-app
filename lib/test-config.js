// Load environment variables
require('dotenv').config();

// Simple configuration test
console.log('🧪 Testing HomeBuddy configuration...\n');

// Check environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

console.log('Environment Variables:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('- Supabase Key:', supabaseKey ? '✅ Present' : '❌ Missing');
console.log('- PostHog Key:', posthogKey ? '✅ Present' : '❌ Missing');
console.log('- PostHog Host:', posthogHost ? '✅ Present' : '❌ Missing');

const allPresent = !!(supabaseUrl && supabaseKey && posthogKey && posthogHost);

if (allPresent) {
  console.log('\n✅ All environment variables are configured correctly');
  console.log('🎉 Supabase client configuration is ready!');
} else {
  console.log('\n❌ Some environment variables are missing');
  console.log('⚠️  Please check your .env file');
}

console.log('\n📊 Configuration Status:', allPresent ? 'READY' : 'NEEDS FIXING'); 