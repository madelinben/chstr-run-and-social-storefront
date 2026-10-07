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
  await expect(page.getByRole('link', { name: 'Book online' })).toHaveAttribute('href', 'https://portal.sportskey.com/venues/cheshire-county-sports-club/events/PNMF01');
  await expect(page.getByText('Tuesday').first()).toBeVisible();
  await expect(page.getByText('19:30 to 20:30')).toBeVisible();
  const download = await page.getByRole('link', { name: 'Download calendar file' }).getAttribute('href');
  if (!download) throw new Error('The calendar download link has no href');
  const ics = await page.request.get(download);
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

test('the Monday route rule is stated on the home page, events page and FAQs', async ({ page }) => {
  for (const path of ['/', '/events/', '/faqs/']) {
    await page.goto(path);
    // Present in the page text (the FAQ answer sits inside a collapsed <details>, so check content, not visibility).
    await expect(page.locator('main')).toContainText('never more than twice a month');
  }
});

test('the members page introduces the leaders and has space for local legends', async ({ page }) => {
  await page.goto('/members/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Members');
  for (const [name, role] of [['Corey', /social and the football/], ['Emily', /ASICS FrontRunner/], ['Nathan', /Plans the routes/]] as const) {
    const card = page.locator('li', { has: page.getByRole('heading', { name }) });
    await expect(card.getByText(role)).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Local Legends' })).toBeVisible();
  await expect(page.getByText('Kudos', { exact: true }).first()).toBeVisible();
});

test('the home page tells new members who to look for and what the club has done', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Who To Look For' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Corey' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What We Have Been Up To' })).toBeVisible();
});

test('past events: an archive page and a gallery page for each event', async ({ page }) => {
  await page.goto('/events/past/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Past Events');
  for (const title of ['Chester Marathon Sign Making', 'The Big Run at FYP Gym Saltney', '10k Run With Wrexham Run Club']) await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.goto('/events/big-run-fyp-gym-saltney/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Big Run at FYP Gym Saltney');
  await expect(page.getByText('Saturday 5 September 2026')).toBeVisible();
  await expect(page.getByText('With Steazy Wrexham Run Club', { exact: true })).toBeVisible();
  // The event's own gallery: the list right after its heading (the cards further down are link thumbnails with empty alt).
  const gallery = page.getByRole('heading', { name: 'Gallery From The Day' }).locator('xpath=following-sibling::ul[1]').locator('img');
  expect(await gallery.count()).toBeGreaterThanOrEqual(4);
  for (const alt of await gallery.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')))) expect((alt ?? '').length).toBeGreaterThan(5);
});

test('the 18 October long run is listed as special event until it has happened', async ({ page }) => {
  await page.goto('/events/long-run/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Long Run');
  await expect(page.getByText('Sunday 18 October 2026')).toBeVisible();
});

test('no console errors, uncaught exceptions or failed requests on any page', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => message.type() === 'error' && problems.push(`console: ${message.text()}`));
  page.on('pageerror', (error) => problems.push(`exception: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`));
  page.on('response', (response) => response.status() >= 400 && problems.push(`${response.status()}: ${response.url()}`));
  for (const path of ['/', '/events/', '/events/past/', '/events/long-run/', '/gallery/', '/members/', '/faqs/', '/waiver/', '/contact/', '/merchandise/', '/merchandise/club-tee/', '/merchandise/jumper/', '/llms.txt', '/robots.txt']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    });
  }
  // The calendar file is a download, so fetch it rather than navigate to it.
  const calendar = await page.request.get('/chstr-sessions.ics');
  if (calendar.status() >= 400) problems.push(`${calendar.status()}: /chstr-sessions.ics`);
  expect(problems).toEqual([]);
});

for (const width of [768, 1024]) {
  for (const path of ['/', '/events/', '/members/', '/merchandise/']) {
    test(`header and layout fit at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const header = await page.locator('header').boundingBox();
      expect(header?.height ?? 0).toBeLessThan(130);
    });
  }
}

test('buttons respond to hover and press with whole-pixel offsets, never a transform', async ({ page }) => {
  // A transformed button becomes its own GPU layer over the animated collage, which can show dark seams at fractional display scales.
  await page.goto('/');
  const button = page.getByRole('link', { name: 'Shop the merch' });
  await button.hover();
  await page.waitForTimeout(250);
  expect(await button.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  expect(await button.evaluate((node) => getComputedStyle(node).top)).toBe('-2px');
  await page.mouse.down();
  await page.waitForTimeout(250);
  expect(await button.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  expect(await button.evaluate((node) => getComputedStyle(node).top)).toBe('2px');
  await page.mouse.up();
});

test('the header cart button stays on one line, and shop cards in a row are the same height', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto('/');
  const cart = await page.getByRole('button', { name: /^Cart/ }).boundingBox();
  expect(cart?.height ?? 999).toBeLessThan(60);
  const cards = page.locator('main section', { has: page.getByRole('heading', { name: 'Wear The Crew' }) }).locator('li');
  await cards.first().scrollIntoViewIfNeeded();
  const heights = await cards.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().height)));
  expect(heights.length).toBeGreaterThan(1);
  expect(new Set(heights).size).toBe(1);
});
