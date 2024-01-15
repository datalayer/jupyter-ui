/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { test, expect } from '@playwright/test';

test('Default', async ({ page }) => {
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-cell--default',
  );

  await page.getByLabel('Code Cell Content').waitFor();
  await page.waitForTimeout(500);

  await page
    .getByLabel('Code Cell Content')
    .getByRole('textbox')
    .fill('print("hello from remote")');
  await page.keyboard.press('Shift+Enter');
  await expect(
    page.getByLabel('Code Cell Content').locator('pre'),
  ).toContainText('hello from remote');
});

test('Lite Python', async ({ page }) => {
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-cell--lite-python',
  );
  await page.getByLabel('Code Cell Content with Output').waitFor();

  await expect(
    page.getByLabel('Code Cell Content with Output').locator('pre'),
  ).toContainText("sys.platform='emscripten'");
});
