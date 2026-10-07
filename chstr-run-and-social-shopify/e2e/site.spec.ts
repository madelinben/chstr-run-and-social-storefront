import { expect, test } from '@playwright/test';

test('home shows when, where and free', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Mondays/i).first()).toBeVisible();
  await expect(page.getByText(/Architect/i).first()).toBeVisible();
  await expect(page.getByText(/free/i).first()).toBeVisible();
});

test('faq accordion opens', async ({ page }) => {
  await page.goto('/faqs');
  const first = page.locator('summary').first();
  await first.click();
  await expect(page.locator('details[open]')).toHaveCount(1);
});

test('add to cart reaches checkout link', async ({ page }) => {
  await page.goto('/merchandise/club-tee');
  await page.getByRole('button', { name: 'Add To Cart' }).click();
  await expect(page.getByRole('button', { name: /Added/ })).toBeVisible();
  await page.getByRole('button', { name: /^Cart/ }).click();
  await expect(page.getByRole('dialog').getByText('£20.00')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go To Checkout' })).toHaveAttribute('href', /checkout/);
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

test('events page lists football with its venue and a calendar download', async ({ page }) => {
  await page.goto('/events/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Events');
  await expect(page.getByText('Chester University Football Pitches').first()).toBeVisible();
  await expect(page.getByText(/Parkgate Rd/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book Back to Netball' })).toHaveAttribute('href', /chesternetballclub\.org\/back-to-netball/);
  const download = await page.getByRole('link', { name: 'Download calendar file' }).getAttribute('href');
  const ics = await page.request.get(download!);
  expect(ics.status()).toBe(200);
  expect(await ics.text()).toContain('BEGIN:VCALENDAR');
});

test('the lights notice is on the home and waiver pages', async ({ page }) => {
  for (const path of ['/', '/waiver/']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Bring A Light' })).toBeVisible();
    await expect(page.getByText(/head torch/i).first()).toBeVisible();
  }
});

test('the brand motto shows on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('All people, all paces, all welcome.').first()).toBeVisible();
});

test('gallery page has real alt text on every picture', async ({ page }) => {
  await page.goto('/gallery/');
  const images = page.locator('main ul:not([aria-hidden]) img'); // the banner's decorative thumbnails are aria-hidden
  expect(await images.count()).toBeGreaterThan(10);
  for (const alt of await images.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')))) expect((alt ?? '').length).toBeGreaterThan(5);
});

test('a product with cleaned-up pictures shows its back view on hover and front and back in the gallery', async ({ page }) => {
  await page.goto('/merchandise/');
  const card = page.locator('li', { has: page.getByRole('heading', { name: 'Heavyweight Hoodie' }) });
  await expect(card.locator('img')).toHaveCount(2); // front, plus the back that fades in on hover
  const back = card.locator('img').nth(1);
  await expect(back).toHaveCSS('opacity', '0');
  await card.hover();
  await expect(back).toHaveCSS('opacity', '1');

  await page.goto('/merchandise/jumper/');
  await expect(page.getByRole('img', { name: /Grey, front view/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Grey, back view/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Blue, back view/ })).toBeVisible();
});

test('the size guide modal opens from the merchandise page', async ({ page }) => {
  await page.goto('/merchandise/');
  await page.getByRole('button', { name: 'Size guide' }).click();
  const dialog = page.getByRole('dialog', { name: 'Size Guide' });
  await expect(dialog.getByRole('row', { name: /XL/ }).first()).toBeVisible();
  await expect(dialog.getByText('43"–45"')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close size guide' }).click();
  await expect(dialog).toBeHidden();
});
