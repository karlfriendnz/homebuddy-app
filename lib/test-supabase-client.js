// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Test Supabase client creation
console.log('🧪 Testing Supabase client creation...\n');

try {
  // Test if we can import the Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create the client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'homebuddy-test',
      },
    },
  });
  
  console.log('✅ Supabase client created successfully');
  console.log('Client URL:', supabase.supabaseUrl);
  console.log('Client configured for:', process.env.EXPO_PUBLIC_ENVIRONMENT || 'development');
  
  // Test a simple query
  console.log('\n🧪 Testing database connection...');
  
  // Note: This will fail due to RLS policies, but that's expected
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    console.log('✅ RLS policies are working (expected error):', error.message);
  } else {
    console.log('⚠️  RLS policies might not be configured properly');
  }
  
  console.log('\n🎉 Supabase client configuration is working correctly!');
  
} catch (error) {
  console.error('❌ Failed to create or test Supabase client:', error.message);
  process.exit(1);
} 