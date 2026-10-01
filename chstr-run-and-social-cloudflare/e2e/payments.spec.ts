import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// Needs PAYMENT_PROVIDERS=mock,stripe and MOCK_PAYMENT_SECRET in .env.local (see .env.example).
const secret = 'local-dev-mock-secret';

function countOrders(reference: string): number {
  const out = execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'chstr-orders', '--local', '--json', '--command', `SELECT COUNT(*) AS n FROM orders WHERE payment_reference = '${reference}'`], { encoding: 'utf8' });
  return JSON.parse(out.slice(out.indexOf('[')))[0].results[0].n;
}

test('checkout returns a provider url for the default provider', async ({ request }) => {
  const response = await request.post('/api/checkout', { data: { lines: [{ productSlug: 'club-tee', size: 'M', quantity: 1 }] } });
  expect(response.status()).toBe(200);
  expect((await response.json()).url).toContain('/merchandise/thanks');
});

test('checkout refuses a provider that is not enabled', async ({ request }) => {
  const response = await request.post('/api/checkout', { data: { provider: 'nope', lines: [{ productSlug: 'club-tee', size: 'M', quantity: 1 }] } });
  expect(response.status()).toBe(502);
});

test('paid webhook stores one order and a replay stores none', async ({ request }) => {
  const reference = `e2e-${Date.now()}`;
  const data = { reference, email: 'runner@example.com', lines: [{ productSlug: 'club-tee', size: 'M', quantity: 2, unitPricePence: 2000 }] };
  const headers = { 'x-mock-secret': secret };

  expect((await request.post('/api/payments/webhook/mock', { data, headers })).status()).toBe(200);
  expect(countOrders(reference)).toBe(1);
  expect((await request.post('/api/payments/webhook/mock', { data, headers })).status()).toBe(200);
  expect(countOrders(reference)).toBe(1);
});

test('webhook rejects a wrong secret and an unknown provider', async ({ request }) => {
  const data = { reference: 'x', email: 'a@b.c', lines: [{ productSlug: 'club-tee', size: 'M', quantity: 1, unitPricePence: 2000 }] };
  expect((await request.post('/api/payments/webhook/mock', { data, headers: { 'x-mock-secret': 'wrong' } })).status()).toBe(400);
  expect((await request.post('/api/payments/webhook/nope', { data })).status()).toBe(400);
});
