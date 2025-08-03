// Simple test to verify household_members query works
// Run this with: node test-household-query.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHouseholdQuery() {
  try {
    console.log('Testing household_members query...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('household_members')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Query failed:', error);
      return;
    }
    
    console.log('Query successful!');
    console.log('Result:', data);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testHouseholdQuery(); 