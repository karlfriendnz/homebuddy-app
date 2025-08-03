#!/usr/bin/env node

/**
 * HomeBuddy Pre-commit Check Script
 * Enforces project rules and checks for violations before commits
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

// Project rules to check
const RULES = {
  // Check for hardcoded colors
  hardcodedColors: {
    pattern: /['"`]#[0-9a-fA-F]{3,6}['"`]/g,
    message: '❌ Hardcoded color values found. Use global styles instead.',
    examples: [
      "'#6366f1' → colors.primary[500]",
      "'#ffffff' → colors.background",
      "'#6b7280' → colors.neutral[500]"
    ]
  },
  
  // Check for hardcoded spacing
  hardcodedSpacing: {
    pattern: /(?:margin|padding|gap|top|bottom|left|right|width|height):\s*\d+/g,
    message: '❌ Hardcoded spacing values found. Use global spacing instead.',
    examples: [
      "padding: 20 → padding: spacing[5]",
      "marginTop: 16 → marginTop: spacing[4]",
      "gap: 12 → gap: spacing[3]"
    ]
  },
  
  // Check for hardcoded typography
  hardcodedTypography: {
    pattern: /fontSize:\s*\d+/g,
    message: '❌ Hardcoded font sizes found. Use global typography instead.',
    examples: [
      "fontSize: 16 → fontSize: typography.size.base",
      "fontSize: 24 → fontSize: typography.size['2xl']",
      "fontSize: 14 → fontSize: typography.size.sm"
    ]
  },
  
  // Check for missing global styles import
  missingGlobalStyles: {
    pattern: /import.*styles\/global/,
    message: '❌ Missing global styles import. Add: import { colors, componentStyles } from "../../styles/global"',
    required: true
  },
  
  // Check for StyleSheet.create usage
  styleSheetCreate: {
    pattern: /StyleSheet\.create\s*\(\s*\{/g,
    message: '❌ StyleSheet.create usage found. Use global styles instead.',
    examples: [
      "StyleSheet.create({...}) → componentStyles.*",
      "const styles = StyleSheet.create({...}) → Use global styles"
    ]
  }
};

// Files to check
const FILES_TO_CHECK = [
  '**/*.tsx',
  '**/*.ts',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/.expo/**',
  '!**/web-build/**'
];

// Get staged files
function getStagedFiles() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output.split('\n').filter(file => file.trim() && file.match(/\.(ts|tsx)$/));
  } catch (error) {
    console.log(`${colors.yellow}Warning: Could not get staged files. Checking all TypeScript files...${colors.reset}`);
    return [];
  }
}

// Check file for violations
function checkFile(filePath) {
  const violations = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Skip files that are in the global styles directory
    if (filePath.includes('styles/global')) {
      return violations;
    }
    
    Object.entries(RULES).forEach(([ruleName, rule]) => {
      const matches = content.match(rule.pattern);
      
      if (rule.required && !matches) {
        // Required pattern not found
        violations.push({
          rule: ruleName,
          message: rule.message,
          examples: rule.examples || [],
          file: filePath,
          lines: []
        });
      } else if (!rule.required && matches) {
        // Forbidden pattern found
        const lineNumbers = [];
        lines.forEach((line, index) => {
          if (line.match(rule.pattern)) {
            lineNumbers.push(index + 1);
          }
        });
        
        violations.push({
          rule: ruleName,
          message: rule.message,
          examples: rule.examples || [],
          file: filePath,
          lines: lineNumbers
        });
      }
    });
    
  } catch (error) {
    console.log(`${colors.red}Error reading file ${filePath}: ${error.message}${colors.reset}`);
  }
  
  return violations;
}

// Main function
function main() {
  console.log(`${colors.bold}${colors.blue}🏠 HomeBuddy Pre-commit Check${colors.reset}\n`);
  
  const stagedFiles = getStagedFiles();
  const filesToCheck = stagedFiles.length > 0 ? stagedFiles : ['app/**/*.tsx', 'components/**/*.tsx', 'lib/**/*.ts'];
  
  let totalViolations = 0;
  let checkedFiles = 0;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const violations = checkFile(file);
      if (violations.length > 0) {
        console.log(`${colors.red}${file}${colors.reset}`);
        violations.forEach(violation => {
          console.log(`  ${violation.message}`);
          if (violation.lines.length > 0) {
            console.log(`    Lines: ${violation.lines.join(', ')}`);
          }
          if (violation.examples.length > 0) {
            console.log(`    Examples:`);
            violation.examples.forEach(example => {
              console.log(`      ${colors.yellow}${example}${colors.reset}`);
            });
          }
        });
        totalViolations += violations.length;
      }
      checkedFiles++;
    }
  });
  
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Files checked: ${checkedFiles}`);
  console.log(`  Violations found: ${totalViolations}`);
  
  if (totalViolations > 0) {
    console.log(`\n${colors.red}${colors.bold}❌ Commit blocked due to project rule violations.${colors.reset}`);
    console.log(`Please fix the violations above and try again.`);
    console.log(`\nFor guidance, see: ${colors.blue}PROJECT_RULES.md${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ All project rules passed!${colors.reset}`);
    console.log(`Ready to commit. 🚀`);
  }
}

// Run the check
if (require.main === module) {
  main();
}

module.exports = { checkFile, RULES }; 