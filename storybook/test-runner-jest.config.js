/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

const { getJestConfig } = require('@storybook/test-runner');

const defaultConfig = getJestConfig();

module.exports = {
  ...defaultConfig,
  testTimeout: 30000,
  maxWorkers: 2,
  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: ['chromium'],
      launchOptions: {
        headless: true,
      },
    },
  },
};
