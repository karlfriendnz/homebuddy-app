  {
    // HomeBuddy Project Rules for all files
    rules: {
      // Enforce TypeScript best practices
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Enforce proper error handling
      'no-console': 'warn',
      'prefer-const': 'error',
      
      // Enforce React best practices
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unescaped-entities': 'error',
    }
  },
  {
    // Rules for TypeScript files
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      // Warn about potential hardcoded values (manual review required)
      'no-magic-numbers': ['warn', {
        ignore: [
          -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24, 25, 30, 36, 40, 48, 50, 60, 80, 100, 400, 500, 600, 1000
        ],
        ignoreArrayIndexes: true,
        detectObjects: false
      }],
      
      // Enforce consistent naming
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^[A-Z][a-zA-Z]+Props$',
            match: true
          }
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        }
      ],
    }
  }