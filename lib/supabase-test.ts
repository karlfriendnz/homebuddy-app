import { supabase } from './supabase';
import { userUtils, householdUtils, authUtils } from './supabase-utils';

// Test Supabase connectivity
export const testSupabaseConnection = async () => {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Test environment variables
export const testEnvironmentVariables = () => {
  console.log('🧪 Testing environment variables...');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  
  const results = {
    supabaseUrl: !!supabaseUrl,
    supabaseKey: !!supabaseKey,
    posthogKey: !!posthogKey,
    posthogHost: !!posthogHost
  };
  
  console.log('Environment variables status:', results);
  
  const allPresent = Object.values(results).every(Boolean);
  
  if (allPresent) {
    console.log('✅ All environment variables are present');
  } else {
    console.error('❌ Missing environment variables:', results);
  }
  
  return allPresent;
};

// Test database tables
export const testDatabaseTables = async () => {
  console.log('🧪 Testing database tables...');
  
  const tables = [
    'users',
    'households',
    'household_members',
    'rooms',
    'tasks',
    'events',
    'shop_templates',
    'shopping_trips',
    'shopping_items',
    'user_points',
    'points_transactions',
    'streaks',
    'rewards',
    'reward_redemptions',
    'push_notifications'
  ];
  
  const results: Record<string, boolean> = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      results[table] = !error;
      
      if (error) {
        console.error(`❌ Table ${table} test failed:`, error);
      } else {
        console.log(`✅ Table ${table} accessible`);
      }
    } catch (error) {
      results[table] = false;
      console.error(`❌ Table ${table} error:`, error);
    }
  }
  
  const allTablesWorking = Object.values(results).every(Boolean);
  
  if (allTablesWorking) {
    console.log('✅ All database tables are accessible');
  } else {
    console.error('❌ Some database tables are not accessible:', results);
  }
  
  return allTablesWorking;
};

// Test RLS policies
export const testRLSPolicies = async () => {
  console.log('🧪 Testing RLS policies...');
  
  try {
    // Test that unauthenticated users cannot access protected data
    const { data: unauthenticatedUsers, error: unauthenticatedError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // This should fail due to RLS
    if (!unauthenticatedError && unauthenticatedUsers && unauthenticatedUsers.length > 0) {
      console.error('❌ RLS policy test failed: Unauthenticated user can access users table');
      return false;
    }
    
    console.log('✅ RLS policies are working correctly');
    return true;
  } catch (error) {
    console.error('❌ RLS policy test error:', error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running all Supabase tests...\n');
  
  const results = {
    environmentVariables: testEnvironmentVariables(),
    connection: await testSupabaseConnection(),
    tables: await testDatabaseTables(),
    rlsPolicies: await testRLSPolicies()
  };
  
  console.log('\n📊 Test Results:');
  console.log('Environment Variables:', results.environmentVariables ? '✅' : '❌');
  console.log('Connection:', results.connection ? '✅' : '❌');
  console.log('Database Tables:', results.tables ? '✅' : '❌');
  console.log('RLS Policies:', results.rlsPolicies ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Supabase is properly configured.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
  
  return allPassed;
};

// Export for use in development
export default {
  testSupabaseConnection,
  testEnvironmentVariables,
  testDatabaseTables,
  testRLSPolicies,
  runAllTests
}; 