/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { test, expect } from '@playwright/test';

test('Default', async ({ page }) => {
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-console--default'
  );

  await page.getByText(/^Python \d.\d+.\d+ | packaged by/).waitFor();
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
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-console--lite-python'
  );

  await page
    .getByText('A WebAssembly-powered Python kernel backed by Pyodide')
    .waitFor();
  await page
    .getByLabel('Code Cell Content')
    .getByRole('textbox')
    .last()
    .fill('print("hello from pyodide")');
  await page.keyboard.press('Shift+Enter');
  await expect(
    page.getByLabel('notebook content').locator('pre').last()
  ).toContainText('hello from pyodide');
});

test('Lite JavaScript', async ({ page }) => {
  await page.goto(
    'http://localhost:6006/iframe.html?id=components-console--lite-javascript'
  );

  await page.getByText('A JavaScript kernel running in the browser').waitFor();
  await page
    .getByLabel('Code Cell Content')
    .getByRole('textbox')
    .last()
    .fill('Array(4).fill("a")');
  await page.keyboard.press('Shift+Enter');
  await expect(
    page.getByLabel('notebook content').locator('pre').last()
  ).toContainText("[ 'a', 'a', 'a', 'a' ]");
});
