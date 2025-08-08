import { createClient, SupabaseClient } from '@supabase/supabase-js';

// App types for type safety
export type AppName = 'homebuddy' | 'taskmaster' | 'financebuddy' | 'healthbuddy';

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  key: string;
  schema: string;
  appName: AppName;
}

// Database configurations for each app
export const databaseConfigs: Record<AppName, DatabaseConfig> = {
  homebuddy: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    schema: 'homebuddy',
    appName: 'homebuddy'
  },
  taskmaster: {
    url: process.env.EXPO_PUBLIC_TASKMASTER_SUPABASE_URL || '',
    key: process.env.EXPO_PUBLIC_TASKMASTER_SUPABASE_ANON_KEY || '',
    schema: 'taskmaster',
    appName: 'taskmaster'
  },
  financebuddy: {
    url: process.env.EXPO_PUBLIC_FINANCEBUDDY_SUPABASE_URL || '',
    key: process.env.EXPO_PUBLIC_FINANCEBUDDY_SUPABASE_ANON_KEY || '',
    schema: 'financebuddy',
    appName: 'financebuddy'
  },
  healthbuddy: {
    url: process.env.EXPO_PUBLIC_HEALTHBUDDY_SUPABASE_URL || '',
    key: process.env.EXPO_PUBLIC_HEALTHBUDDY_SUPABASE_ANON_KEY || '',
    schema: 'healthbuddy',
    appName: 'healthbuddy'
  }
};

// Get database configuration for a specific app
export const getDatabaseConfig = (appName: AppName): DatabaseConfig => {
  const config = databaseConfigs[appName];
  if (!config.url || !config.key) {
    throw new Error(`Database configuration not found for app: ${appName}`);
  }
  return config;
};

// Create Supabase client for a specific app
export const createAppSupabaseClient = (appName: AppName): SupabaseClient => {
  const config = getDatabaseConfig(appName);
  return createClient(config.url, config.key);
};

// Current app configuration (defaults to homebuddy)
export const getCurrentAppConfig = (): DatabaseConfig => {
  return getDatabaseConfig('homebuddy');
};

// Create Supabase client for current app
export const createCurrentAppSupabaseClient = (): SupabaseClient => {
  return createAppSupabaseClient('homebuddy');
};

