#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// App configuration template
const appConfigs = {
  taskmaster: {
    name: 'TaskMaster',
    description: 'Task and project management app',
    color: '#10b981',
    icon: '📋',
    features: ['tasks', 'projects', 'time-tracking', 'priorities']
  },
  financebuddy: {
    name: 'FinanceBuddy',
    description: 'Personal finance tracking app',
    color: '#f59e0b',
    icon: '💰',
    features: ['accounts', 'transactions', 'budgets', 'reports']
  },
  healthbuddy: {
    name: 'HealthBuddy',
    description: 'Health and fitness tracking app',
    color: '#ef4444',
    icon: '🏃‍♂️',
    features: ['workouts', 'nutrition', 'goals', 'progress']
  }
};

// Validate app name
function validateAppName(appName) {
  if (!appConfigs[appName]) {
    console.error(`❌ Invalid app name: ${appName}`);
    console.log('Available apps:', Object.keys(appConfigs).join(', '));
    process.exit(1);
  }
}

// Create app directory structure
function createAppStructure(appName, config) {
  const appDir = path.join(__dirname, '..', 'apps', appName);
  
  console.log(`📁 Creating app structure for ${config.name}...`);
  
  // Create app directory
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  // Create app.json
  const appJson = {
    expo: {
      name: config.name,
      slug: appName,
      version: "1.0.0",
      orientation: "portrait",
      icon: `./assets/images/icon.png`,
      scheme: appName,
      userInterfaceStyle: "automatic",
      splash: {
        image: `./assets/images/splash-icon.png`,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.karlfriendnz.${appName}`,
        buildNumber: "1"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: `./assets/images/adaptive-icon.png`,
          backgroundColor: "#ffffff"
        },
        package: `com.karlfriendnz.${appName}`,
        versionCode: 1
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: `./assets/images/favicon.png`
      },
      plugins: ["expo-router", "expo-notifications"],
      experiments: {
        typedRoutes: true
      }
    }
  };
  
  fs.writeFileSync(path.join(appDir, 'app.json'), JSON.stringify(appJson, null, 2));
  
  // Create package.json
  const packageJson = {
    name: appName,
    version: "1.0.0",
    main: "expo-router/entry",
    scripts: {
      start: "expo start",
      android: "expo start --android",
      ios: "expo start --ios",
      web: "expo start --web"
    },
    dependencies: {
      "@expo/vector-icons": "^14.0.0",
      "@react-navigation/native": "^6.0.2",
      "expo": "~50.0.0",
      "expo-font": "~11.10.0",
      "expo-linking": "~6.2.0",
      "expo-router": "~3.4.0",
      "expo-splash-screen": "~0.26.0",
      "expo-status-bar": "~1.11.0",
      "react": "18.2.0",
      "react-dom": "18.2.0",
      "react-native": "0.73.0",
      "react-native-safe-area-context": "4.8.2",
      "react-native-screens": "~3.29.0",
      "@supabase/supabase-js": "^2.39.0",
      "expo-notifications": "~0.27.0",
      "expo-device": "~5.9.0",
      "expo-constants": "~15.4.0"
    },
    devDependencies: {
      "@babel/core": "^7.20.0",
      "@types/react": "~18.2.45",
      "typescript": "^5.1.3"
    },
    private: true
  };
  
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Create environment file
  const envContent = `# ${config.name} Database Configuration
EXPO_PUBLIC_SUPABASE_URL=https://${appName}-db.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-${appName}-anon-key

# App Configuration
EXPO_PUBLIC_APP_NAME=${config.name}
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=development

# PostHog Configuration
EXPO_PUBLIC_POSTHOG_KEY=your-posthog-key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
`;
  
  fs.writeFileSync(path.join(appDir, '.env.example'), envContent);
  
  // Create basic app structure
  const dirs = [
    'app',
    'components',
    'lib',
    'styles',
    'assets/images',
    'migrations'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(appDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Create main app file
  const appContent = `import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

export default function ${config.name.replace(/\s+/g, '')}Layout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '${config.name}' }} />
    </Stack>
  );
}
`;
  
  fs.writeFileSync(path.join(appDir, 'app/_layout.tsx'), appContent);
  
  // Create index file
  const indexContent = `import { View, Text } from 'react-native';
import { componentStyles } from '../styles/global';

export default function ${config.name.replace(/\s+/g, '')}Screen() {
  return (
    <View style={componentStyles.container}>
      <Text style={componentStyles.text}>
        Welcome to ${config.name}! ${config.icon}
      </Text>
      <Text style={[componentStyles.text, componentStyles.textSecondary]}>
        ${config.description}
      </Text>
    </View>
  );
}
`;
  
  fs.writeFileSync(path.join(appDir, 'app/index.tsx'), indexContent);
  
  // Create README
  const readmeContent = `# ${config.name}

${config.description}

## Features

${config.features.map(feature => `- ${feature}`).join('\n')}

## Setup

1. Copy \`.env.example\` to \`.env\` and fill in your configuration
2. Run \`npm install\`
3. Run \`npm start\`

## Database

This app uses a separate Supabase database with the following tables:
- \`${appName}_users\`
- \`${appName}_projects\` (if applicable)
- \`${appName}_tasks\` (if applicable)
- \`${appName}_settings\`

## Development

This app is part of the HomeBuddy ecosystem and uses shared components and utilities.
`;
  
  fs.writeFileSync(path.join(appDir, 'README.md'), readmeContent);
  
  console.log(`✅ Created app structure for ${config.name}`);
}

// Create database migration
function createDatabaseMigration(appName, config) {
  const migrationDir = path.join(__dirname, '..', 'migrations');
  const migrationFile = path.join(migrationDir, `20241201_create_${appName}_schema.sql`);
  
  const migrationContent = `-- ${config.name} Database Schema
-- This migration creates the ${config.name}-specific tables with app prefixes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ${config.name} Users Table
CREATE TABLE IF NOT EXISTS ${appName}_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- ${config.name} Settings Table
CREATE TABLE IF NOT EXISTS ${appName}_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_${appName}_users_email ON ${appName}_users(email);
CREATE INDEX IF NOT EXISTS idx_${appName}_settings_user_id ON ${appName}_settings(user_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_${appName}_users_updated_at 
  BEFORE UPDATE ON ${appName}_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_${appName}_settings_updated_at 
  BEFORE UPDATE ON ${appName}_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ${appName}_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${appName}_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON ${appName}_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON ${appName}_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view their own settings" ON ${appName}_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON ${appName}_settings
  FOR ALL USING (user_id = auth.uid());
`;
  
  fs.writeFileSync(migrationFile, migrationContent);
  console.log(`✅ Created database migration for ${config.name}`);
}

// Main function
function main() {
  const appName = process.argv[2];
  
  if (!appName) {
    console.error('❌ Please provide an app name');
    console.log('Usage: node create-app.js <app-name>');
    console.log('Available apps:', Object.keys(appConfigs).join(', '));
    process.exit(1);
  }
  
  validateAppName(appName);
  const config = appConfigs[appName];
  
  console.log(`🚀 Creating ${config.name} app...`);
  console.log(`📝 Description: ${config.description}`);
  console.log(`🎨 Color: ${config.color}`);
  console.log(`📋 Features: ${config.features.join(', ')}`);
  console.log('');
  
  createAppStructure(appName, config);
  createDatabaseMigration(appName, config);
  
  console.log('');
  console.log(`🎉 Successfully created ${config.name}!`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. cd apps/${appName}`);
  console.log('2. Copy .env.example to .env and configure your database');
  console.log('3. Run npm install');
  console.log('4. Create a new Supabase project for this app');
  console.log('5. Apply the database migration');
  console.log('6. Run npm start');
}

main();

