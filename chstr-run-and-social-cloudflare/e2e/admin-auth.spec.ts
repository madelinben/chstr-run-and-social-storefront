import { readFileSync } from 'node:fs';
import { SignJWT } from 'jose';
import { expect, test } from '@playwright/test';

// Reads the same .env.local the preview build uses.
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((line) => line.includes('=') && !line.startsWith('#')).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const sessionFor = (email: string, secret = env.SESSION_SECRET) =>
  new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode(secret));

const cookie = (value: string) => ({ name: 'chstr_session', value, url: 'http://localhost:4321' });

for (const path of ['/admin/orders', '/keystatic', '/keystatic/collection/products', '/api/keystatic/tree']) {
  test(`signed-out visitor is sent to login from ${path}`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe(`/auth/login?next=${encodeURIComponent(path)}`);
  });
}

test('login redirects to Google with code flow, PKCE, state and nonce', async ({ request }) => {
  const response = await request.get('/auth/login?next=/admin/orders', { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  const url = new URL(response.headers().location);
  expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
  expect(url.searchParams.get('client_id')).toBe(env.GOOGLE_CLIENT_ID);
  expect(url.searchParams.get('redirect_uri')).toBe(`${env.SITE_ORIGIN}/auth/callback`);
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('state')).toBeTruthy();
  expect(url.searchParams.get('nonce')).toBeTruthy();
  expect(response.headers()['set-cookie']).toMatch(/chstr_login=.*HttpOnly/i);
});

test('callback refuses a missing or forged state', async ({ request }) => {
  expect((await request.get('/auth/callback?code=x&state=y', { maxRedirects: 0 })).status()).toBe(400);
});

test('allow-listed staff session opens the orders page', async ({ page, context }) => {
  await context.addCookies([cookie(await sessionFor(env.ADMIN_EMAILS))]);
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  await expect(page.getByText(env.ADMIN_EMAILS)).toBeVisible();
});

test('signed-in but not allow-listed is refused', async ({ request }) => {
  const response = await request.get('/admin/orders', { maxRedirects: 0, headers: { cookie: `chstr_session=${await sessionFor('stranger@example.com')}` } });
  expect(response.status()).toBe(302);
});

test('a session signed with the wrong secret is refused', async ({ request }) => {
  const response = await request.get('/admin/orders', { maxRedirects: 0, headers: { cookie: `chstr_session=${await sessionFor(env.ADMIN_EMAILS, 'x'.repeat(40))}` } });
  expect(response.status()).toBe(302);
});

test('state-changing request without a session is refused, and so is a cross-site one', async ({ request }) => {
  // 401 from our middleware, or 403 from Astro's own origin check, which runs first for form posts.
  expect([401, 403]).toContain((await request.post('/admin/orders', { form: { orderId: '1', status: 'FULFILLED' }, maxRedirects: 0 })).status());
  const response = await request.post('/admin/orders', {
    form: { orderId: '1', status: 'FULFILLED' },
    maxRedirects: 0,
    headers: { cookie: `chstr_session=${await sessionFor(env.ADMIN_EMAILS)}`, origin: 'https://evil.example' },
  });
  expect(response.status()).toBe(403);
});

test('sign out clears the session', async ({ page, context }) => {
  await context.addCookies([cookie(await sessionFor(env.ADMIN_EMAILS))]);
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL('/');
  expect((await context.cookies()).find((c) => c.name === 'chstr_session')).toBeUndefined();
});
