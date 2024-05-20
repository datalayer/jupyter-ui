/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * Datalayer License
 */

import { test, expect } from '@playwright/test';

test('Default', async ({ page }) => {
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-notebook--default'
  );

  await page
    .getByRole('region', { name: 'notebook content' })
    .getByLabel('Code Cell Content')
    .waitFor();
  await page.waitForTimeout(500);

  await page
    .getByLabel('Code Cell Content')
    .getByRole('textbox')
    .last()
    .fill('print("hello from remote")');
  await page.keyboard.press('Shift+Enter');
  await expect(
    page.getByLabel('notebook content').locator('pre').last()
  ).toContainText('hello from remote');
});

test('Lite Python', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(
    'http://localhost:6006/iframe.html?id=components-notebook--lite-python'
  );

  await page.getByText('import piplite').click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+Enter');
  await page.getByText('[1]:').waitFor();

  await page
    .getByLabel('Code Cell Content')
    .getByRole('textbox')
    .nth(1)
    .fill('import sys\nprint(f"{sys.platform=}")');
  await page.keyboard.press('Shift+Enter');
  await page.getByLabel('Code Cell Content with Output').waitFor();

  await expect(
    page.getByLabel('Code Cell Content with Output').locator('pre')
  ).toContainText("sys.platform='emscripten'");
});

test('Lite Python Init', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto(
    'http://localhost:6006/iframe.html?id=components-notebook--lite-python-init'
  );

  await page.getByText('import ipywidgets').click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+Enter');
  await page.getByLabel('Code Cell Content with Output').waitFor();

  await expect(page.locator('.jupyter-widgets.widget-slider')).toBeVisible();
});
