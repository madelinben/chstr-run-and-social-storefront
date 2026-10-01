import { describe, expect, it } from 'vitest';
import { chooseProviderId, enabledProviderIds, getPaymentProvider } from '@/services/payments/payment-providers';
import { mockPaymentProvider } from '@/services/payments/mock-payment-provider';
import type { ServerEnvironment } from '@/services/environment/server-environment';

const env = (PAYMENT_PROVIDERS: string, extra: Partial<ServerEnvironment> = {}) => ({ PAYMENT_PROVIDERS, ...extra }) as ServerEnvironment;

describe('enabled providers', () => {
  it('reads an ordered list and trims it', () => {
    expect(enabledProviderIds(env(' stripe , mock '))).toEqual(['stripe', 'mock']);
  });

  it('fails on an unknown provider instead of silently dropping it', () => {
    expect(() => enabledProviderIds(env('stripe,strpe'))).toThrow('Unknown payment provider: strpe');
  });

  it('fails when nothing is enabled', () => {
    expect(() => enabledProviderIds(env(''))).toThrow('lists no provider');
  });
});

describe('chooseProviderId', () => {
  it('defaults to the first enabled provider', () => {
    expect(chooseProviderId(env('mock,stripe'))).toBe('mock');
  });

  it('accepts a requested provider that is enabled', () => {
    expect(chooseProviderId(env('mock,stripe'), 'stripe')).toBe('stripe');
  });

  it('rejects a known provider that is not enabled', () => {
    expect(() => chooseProviderId(env('stripe'), 'mock')).toThrow('not enabled');
  });
});

describe('every registered provider honours the port', () => {
  it.each(['stripe', 'mock'])('%s has a matching id and both methods', (id) => {
    const provider = getPaymentProvider(id);
    expect(provider.id).toBe(id);
    expect(typeof provider.createCheckout).toBe('function');
    expect(typeof provider.readWebhook).toBe('function');
  });
});

describe('mock provider webhook', () => {
  const body = JSON.stringify({ reference: 'r1', email: 'a@b.c', lines: [{ productSlug: 'club-tee', size: 'M', quantity: 1, unitPricePence: 2000 }] });

  it('translates a correctly keyed webhook', async () => {
    const event = await mockPaymentProvider.readWebhook({ body, headers: new Headers({ 'x-mock-secret': 's' }) }, env('mock', { MOCK_PAYMENT_SECRET: 's' }));
    expect(event).toMatchObject({ kind: 'payment-completed', reference: 'r1', phone: null });
  });

  it('rejects a wrong or unset secret', async () => {
    await expect(mockPaymentProvider.readWebhook({ body, headers: new Headers({ 'x-mock-secret': 'x' }) }, env('mock', { MOCK_PAYMENT_SECRET: 's' }))).rejects.toThrow();
    await expect(mockPaymentProvider.readWebhook({ body, headers: new Headers() }, env('mock'))).rejects.toThrow();
  });
});
