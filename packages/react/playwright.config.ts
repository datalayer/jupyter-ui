/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  testMatch: 'stories/**/*.test.ts',
  webServer: {
    command: 'yarn run storybook:ci',
    url: 'http://localhost:6006/iframe.html?id=components-console--default',
    timeout: 5 * 60 * 1000,
    // It is safe to reuse the server for stories testing
    reuseExistingServer: true,
  },
  use: {
    baseURL: process.env.TARGET_URL ?? 'http://localhost:6006',
    trace: 'on-first-retry',
    video: process.env.CI ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { open: process.env.CI ? 'never' : 'on-failure' }],
  ],
};

export default config;
