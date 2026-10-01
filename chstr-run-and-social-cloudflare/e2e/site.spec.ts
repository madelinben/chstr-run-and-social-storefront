import { expect, test } from '@playwright/test';

test('home shows when, where and free', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Mondays/i).first()).toBeVisible();
  await expect(page.getByText(/Architect/i).first()).toBeVisible();
  await expect(page.getByText(/free/i).first()).toBeVisible();
});

test('faq accordion opens', async ({ page }) => {
  await page.goto('/faqs');
  await page.locator('summary').first().click();
  await expect(page.locator('details[open]')).toHaveCount(1);
});

test('basket holds a product from the content collection', async ({ page }) => {
  await page.goto('/merchandise');
  await page.getByRole('button', { name: 'Add To Cart' }).first().click();
  await page.getByRole('button', { name: /^Cart/ }).click();
  await expect(page.getByRole('dialog').getByText('£20.00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go To Checkout' })).toBeVisible();
});

test('hero collage keeps the logo and facts in front, with one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'CHSTR Run & Social' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign the waiver' })).toBeVisible();
  expect(await page.locator('section img').count()).toBeGreaterThan(20);
});

for (const path of ['/', '/faqs/', '/merchandise/', '/waiver/', '/contact/']) {
  test(`no horizontal scroll on a phone at ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.waitForLoadState('load');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('reduced motion stops the drifting columns', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const animation = await page.locator('.hero-col').first().evaluate((node) => getComputedStyle(node).animationName);
  expect(animation).toBe('none');
  await context.close();
});
