#!/usr/bin/env node

/**
 * Build Configuration Validator
 * 
 * This script validates that the build configuration follows the project rules
 * and is ready for building. Run this before any build to ensure consistency.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Required configuration values
const REQUIRED_CONFIG = {
  appName: 'HomeBuddy',
  slug: 'homebuddy',
  bundleIdentifier: 'com.karlfriendnz.homebuddy',
  projectId: 'a629c147-e210-4a5e-ae1d-f49c0ab64c33'
};

// Validation functions
function validateAppJson() {
  console.log(`${colors.blue}${colors.bold}Validating app.json...${colors.reset}`);
  
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const checks = [
      {
        name: 'App name',
        value: appJson.expo.name,
        expected: REQUIRED_CONFIG.appName,
        path: 'expo.name'
      },
      {
        name: 'Slug',
        value: appJson.expo.slug,
        expected: REQUIRED_CONFIG.slug,
        path: 'expo.slug'
      },
      {
        name: 'iOS Bundle Identifier',
        value: appJson.expo.ios?.bundleIdentifier,
        expected: REQUIRED_CONFIG.bundleIdentifier,
        path: 'expo.ios.bundleIdentifier'
      },
      {
        name: 'EAS Project ID',
        value: appJson.expo.extra?.eas?.projectId,
        expected: REQUIRED_CONFIG.projectId,
        path: 'expo.extra.eas.projectId'
      }
    ];
    
    let allValid = true;
    
    checks.forEach(check => {
      if (check.value === check.expected) {
        console.log(`  ${colors.green}✅${colors.reset} ${check.name}: ${check.value}`);
      } else {
        console.log(`  ${colors.red}❌${colors.reset} ${check.name}: Expected "${check.expected}", got "${check.value}"`);
        allValid = false;
      }
    });
    
    // Check for required iOS configuration
    if (appJson.expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== false) {
      console.log(`  ${colors.yellow}⚠️${colors.reset} iOS encryption configuration missing`);
    } else {
      console.log(`  ${colors.green}✅${colors.reset} iOS encryption configuration: ${appJson.expo.ios.infoPlist.ITSAppUsesNonExemptEncryption}`);
    }
    
    // Check for iOS permissions
    const requiredPermissions = [
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSLocationWhenInUseUsageDescription'
    ];
    
    requiredPermissions.forEach(permission => {
      if (appJson.expo.ios?.infoPlist?.[permission]) {
        console.log(`  ${colors.green}✅${colors.reset} ${permission}: Configured`);
      } else {
        console.log(`  ${colors.yellow}⚠️${colors.reset} ${permission}: Missing`);
      }
    });
    
    return allValid;
  } catch (error) {
    console.log(`  ${colors.red}❌${colors.reset} Error reading app.json: ${error.message}`);
    return false;
  }
}

function validateEasJson() {
  console.log(`\n${colors.blue}${colors.bold}Validating eas.json...${colors.reset}`);
  
  try {
    const easJsonPath = path.join(process.cwd(), 'eas.json');
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    
    const requiredProfiles = ['development', 'preview', 'production'];
    let allValid = true;
    
    requiredProfiles.forEach(profile => {
      if (easJson.build[profile]) {
        console.log(`  ${colors.green}✅${colors.reset} ${profile} profile configured`);
      } else {
        console.log(`  ${colors.red}❌${colors.reset} ${profile} profile missing`);
        allValid = false;
      }
    });
    
    // Check CLI version
    if (easJson.cli?.version) {
      console.log(`  ${colors.green}✅${colors.reset} EAS CLI version: ${easJson.cli.version}`);
    } else {
      console.log(`  ${colors.yellow}⚠️${colors.reset} EAS CLI version not specified`);
    }
    
    return allValid;
  } catch (error) {
    console.log(`  ${colors.red}❌${colors.reset} Error reading eas.json: ${error.message}`);
    return false;
  }
}

function validateEnvironmentVariables() {
  console.log(`\n${colors.blue}${colors.bold}Validating environment variables...${colors.reset}`);
  
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_POSTHOG_KEY',
    'EXPO_PUBLIC_POSTHOG_HOST'
  ];
  
  let allValid = true;
  
  // Try to load .env file if it exists
  try {
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (error) {
    // dotenv not available, continue without it
  }
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ${colors.green}✅${colors.reset} ${varName}: Set`);
    } else {
      console.log(`  ${colors.yellow}⚠️${colors.reset} ${varName}: Missing (will be set in EAS)`);
      // Don't fail validation for missing env vars as they're set in EAS
    }
  });
  
  console.log(`  ${colors.blue}ℹ️${colors.reset} Environment variables are configured in EAS Build`);
  
  return true; // Don't fail validation for env vars
}

function validateDependencies() {
  console.log(`\n${colors.blue}${colors.bold}Validating dependencies...${colors.reset}`);
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'expo',
      'expo-router',
      '@supabase/supabase-js',
      'expo-notifications'
    ];
    
    let allValid = true;
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`  ${colors.green}✅${colors.reset} ${dep}: Installed`);
      } else {
        console.log(`  ${colors.red}❌${colors.reset} ${dep}: Missing`);
        allValid = false;
      }
    });
    
    // Check for build scripts
    const buildScripts = [
      'build:ios:preview',
      'build:ios:production',
      'build:android:preview',
      'build:android:production'
    ];
    
    buildScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        console.log(`  ${colors.green}✅${colors.reset} ${script} script: Available`);
      } else {
        console.log(`  ${colors.yellow}⚠️${colors.reset} ${script} script: Missing`);
      }
    });
    
    return allValid;
  } catch (error) {
    console.log(`  ${colors.red}❌${colors.reset} Error reading package.json: ${error.message}`);
    return false;
  }
}

function validateGlobalStyles() {
  console.log(`\n${colors.blue}${colors.bold}Validating global styles...${colors.reset}`);
  
  try {
    const globalStylesPath = path.join(process.cwd(), 'styles', 'global.ts');
    
    if (fs.existsSync(globalStylesPath)) {
      const content = fs.readFileSync(globalStylesPath, 'utf8');
      
      const requiredExports = [
        'colors',
        'componentStyles',
        'spacing',
        'typography'
      ];
      
      let allValid = true;
      
      requiredExports.forEach(exportName => {
        if (content.includes(`export const ${exportName}`) || content.includes(`export { ${exportName}`)) {
          console.log(`  ${colors.green}✅${colors.reset} ${exportName}: Exported`);
        } else {
          console.log(`  ${colors.red}❌${colors.reset} ${exportName}: Missing export`);
          allValid = false;
        }
      });
      
      return allValid;
    } else {
      console.log(`  ${colors.red}❌${colors.reset} Global styles file not found`);
      return false;
    }
  } catch (error) {
    console.log(`  ${colors.red}❌${colors.reset} Error reading global styles: ${error.message}`);
    return false;
  }
}

// Main validation function
function validateBuildConfig() {
  console.log(`${colors.bold}${colors.blue}🏗️  HomeBuddy Build Configuration Validator${colors.reset}\n`);
  
  const validations = [
    validateAppJson,
    validateEasJson,
    validateEnvironmentVariables,
    validateDependencies,
    validateGlobalStyles
  ];
  
  const results = validations.map(validate => validate());
  const allValid = results.every(result => result === true);
  
  console.log(`\n${colors.bold}${colors.blue}📋 Validation Summary${colors.reset}`);
  
  if (allValid) {
    console.log(`\n${colors.green}${colors.bold}🎉 All validations passed! Build configuration is ready.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Some validations failed. Please fix the issues above before building.${colors.reset}`);
    console.log(`\n${colors.yellow}💡 Run 'npm run prebuild' to check for additional issues.${colors.reset}`);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateBuildConfig();
}

module.exports = {
  validateBuildConfig,
  validateAppJson,
  validateEasJson,
  validateEnvironmentVariables,
  validateDependencies,
  validateGlobalStyles
}; 