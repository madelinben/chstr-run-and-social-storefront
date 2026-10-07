import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '@/services/shopify/storefront-client';

const ok = () => new Response('{}', { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('fetchWithRetry', () => {
  it('returns the first good response without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal('fetch', fetchMock);
    expect((await fetchWithRetry('https://x.test', {}, [0, 0])).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a network error and a 503, then succeeds', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', fetchMock);
    expect((await fetchWithRetry('https://x.test', {}, [0, 0])).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries 429 but not a 404', async () => {
    const rateLimited = vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', rateLimited);
    expect((await fetchWithRetry('https://x.test', {}, [0])).status).toBe(200);
    const missing = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', missing);
    expect((await fetchWithRetry('https://x.test', {}, [0, 0])).status).toBe(404);
    expect(missing).toHaveBeenCalledTimes(1);
  });

  it('gives up after the last delay: hands back the failing response, or throws the network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    expect((await fetchWithRetry('https://x.test', {}, [0, 0])).status).toBe(500);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(fetchWithRetry('https://x.test', {}, [0, 0])).rejects.toThrow('fetch failed');
  });
});
