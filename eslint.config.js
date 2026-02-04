/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const path = require('path');

module.exports = tseslint.config(
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname),
        projectService: {
          allowDefaultProject: [
            '*.config.js',
            '*.config.ts',
            '.commitlintrc.js',
            '.eslintrc.js',
            '.lintstagedrc.js',
            'gulpfile.js',
            'packages/*/entries.js',
            'packages/*/vite.config.ts',
            'packages/*/vite-plugins/*.ts',
            'packages/*/*.config.js',
            'packages/*/gulpfile.js',
            'packages/*/scripts/*.js',
            'packages/*/tailwind.config.js',
            'packages/*/webpack.config.js',
            'storybook/.storybook/*.ts',
            'storybook/.storybook/*.tsx',
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 15,
        },
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...prettierConfig.rules,

      // TypeScript specific rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-namespace': 'off',

      // React specific rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
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
  },
  {
    // Configuration for Node.js files (config files)
    files: [
      '**/*.config.js',
      '**/*.config.ts',
      '.commitlintrc.js',
      '.eslintrc.js',
      '.lintstagedrc.js',
      '**/gulpfile.js',
      '**/webpack.config.js',
      '**/sidebars.js',
      '**/docusaurus.config.js',
      '**/babel.config.js',
      '**/jest.config.js',
      '**/prettier.config.js',
      '**/test-runner-jest.config.js',
      '**/test-storybook.js',
      '**/copyUntypedFiles.js',
      '**/helper.js',
      '**/extension.js',
      '**/scripts/*.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        exports: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Allow require() in Docusaurus theme files for SSR compatibility
    files: [
      '**/packages/docusaurus-plugin/src/theme/**/*.tsx',
      '**/docs/src/theme/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/lib/**',
      '**/*.min.js',
      '**/coverage/**',
      '**/.next/**',
      '**/storybook-static/**',
      '**/.husky/**',
      '**/patches/**',
      '**/*.patch',
      'attic/**',
      '**/.docusaurus/**',
      '**/emptyshim.js',
      '**/empty-shim.js',
      'packages/ipyreactive/**',
      'packages/ipyscript/**',
      // Generated documentation
      'packages/lexical/docs/**',
      'packages/react/docs/**',
      'packages/embed/examples/**',
      // Vendored third-party code
      '**/vendor/**',
    ],
  },
);
