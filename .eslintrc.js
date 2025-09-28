/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    // Explicitly set tsconfigRootDir and project to resolve multiple candidate TSConfigRootDirs error
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended', // This must be last
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // We use TypeScript for type checking
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'warn',

    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',

    // Prettier integration
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
    },
    {
      // JavaScript files
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Storybook files
      files: ['**/*.stories.tsx', '**/*.stories.ts'],
      rules: {
        'import/no-anonymous-default-export': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'lib/',
    '*.min.js',
    'coverage/',
    '.next/',
    'storybook-static/',
  ],
};
