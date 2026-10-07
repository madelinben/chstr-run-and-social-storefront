import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

interface Recorded {
  treePaths: string[];
  blobs: string[];
}

/** A stand-in for the GitHub API that serves this repo's own content files and records what gets committed. */
async function fakeGithub(page: Page): Promise<Recorded> {
  const recorded: Recorded = { treePaths: [], blobs: [] };
  await page.route('https://api.github.com/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = decodeURIComponent(url.pathname.replace('/repos/club/site', ''));
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path.startsWith('/contents/app/')) {
      const local = path.replace('/contents/app/', '');
      try {
        if (local.endsWith('.json') || local.endsWith('.md')) return await route.fulfill({ status: 200, contentType: 'text/plain', body: readFileSync(local, 'utf8') });
        return await json(readdirSync(local).map((name) => ({ name, type: 'file' })));
      } catch {
        return json({}, 404);
      }
    }
    if (path === '/git/ref/heads/main') return json({ object: { sha: 'head' } });
    if (path === '/git/commits/head') return json({ tree: { sha: 'base' } });
    if (path === '/git/blobs') {
      const body: unknown = request.postDataJSON();
      recorded.blobs.push(typeof body === 'object' && body !== null && 'content' in body ? String(body.content) : '');
      return json({ sha: `blob-${recorded.blobs.length}` });
    }
    if (path === '/git/trees') {
      const body: unknown = request.postDataJSON();
      if (typeof body === 'object' && body !== null && 'tree' in body && Array.isArray(body.tree)) recorded.treePaths.push(...body.tree.map((entry: { path: string }) => entry.path));
      return json({ sha: 'tree' });
    }
    if (path === '/git/commits') return json({ sha: 'commit' });
    if (path === '/git/refs/heads/main') return json({ ok: true });
    return json({}, 404);
  });
  return recorded;
}

async function signIn(page: Page) {
  await page.goto('/admin/');
  await page.getByLabel('Access token').fill('github_pat_'.padEnd(30, 'x'));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Contact and links' })).toBeVisible();
}

test('the admin is hidden from search engines and locked to GitHub', async ({ page }) => {
  await page.goto('/admin/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /connect-src https:\/\/api\.github\.com/);
  expect(await (await page.request.get('/robots.txt')).text()).toMatch(/Disallow/);
});

test('adding the WhatsApp group link saves one commit with that file only', async ({ page }) => {
  const recorded = await fakeGithub(page);
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Save all changes' })).toBeDisabled();

  await page.getByLabel('Whatsapp group url').fill('https://chat.whatsapp.com/ABC123');
  await page.getByRole('button', { name: 'Save all changes' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  expect(recorded.treePaths).toEqual(['app/src/content/site/settings.json']);
  expect(recorded.blobs[0]).toContain('https://chat.whatsapp.com/ABC123');
});

test('a bad link is refused with a plain message and nothing is committed', async ({ page }) => {
  const recorded = await fakeGithub(page);
  await signIn(page);
  await page.getByLabel('Whatsapp group url').fill('not a link');
  await page.getByRole('button', { name: 'Save all changes' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a full link starting with https://');
  expect(recorded.treePaths).toEqual([]);
});

test('every admin section opens and has no accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fakeGithub(page);
  await signIn(page);
  for (const name of ['Contact and links', 'Weekly sessions', 'Special events', 'Members', 'Home page', 'Pictures', 'FAQs']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    const summary = results.violations.map((violation) => `${violation.id}: ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`);
    expect(summary, `${name}\n${summary.join('\n')}`).toEqual([]);
  }
});

test('signing out forgets the token', async ({ page }) => {
  await fakeGithub(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Access token')).toHaveValue('');
});
