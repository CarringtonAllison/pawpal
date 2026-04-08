import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('home page loads with PawPal heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PawPal');
  });

  test('home page has "Find Your Perfect Pet" button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /find your perfect pet/i })).toBeVisible();
  });

  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/some-nonexistent-page');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page not found')).toBeVisible();
  });

  test('404 page has start over link', async ({ page }) => {
    await page.goto('/some-nonexistent-page');
    const link = page.getByRole('link', { name: /start over/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/');
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('session creation endpoint works', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/sessions', {
      data: {},
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
  });
});
