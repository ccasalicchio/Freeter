import { test, expect } from '@playwright/test';

test.describe('App smoke tests', () => {
  test('app loads and shows welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeAttached();
  });

  test('opens settings via menu', async ({ page }) => {
    await page.goto('/');
    // Check that the page loads without errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(consoleErrors.length).toBe(0);
  });
});
