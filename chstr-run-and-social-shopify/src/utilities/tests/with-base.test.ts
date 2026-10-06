import { afterEach, describe, expect, it, vi } from 'vitest';

async function load(base: string) {
  vi.stubEnv('BASE_URL', base);
  vi.resetModules();
  return import('@/utilities/with-base');
}

afterEach(() => vi.unstubAllEnvs());

describe('at a domain root', () => {
  it('leaves paths alone', async () => {
    const { withBase, withBaseInHtml } = await load('/');
    expect(withBase('/faqs/')).toBe('/faqs/');
    expect(withBaseInHtml('<a href="/waiver/">w</a>')).toBe('<a href="/waiver/">w</a>');
  });
});

describe('under a sub-path', () => {
  it.each(['/repo', '/repo/'])('prefixes internal paths (BASE_URL %s)', async (base) => {
    const { withBase, siteRoot, toAbsolute } = await load(base);
    expect(withBase('/faqs/')).toBe('/repo/faqs/');
    expect(siteRoot(new URL('https://user.github.io'))).toBe('https://user.github.io/repo/');
    expect(toAbsolute(new URL('https://user.github.io'), '/og-default.png')).toBe('https://user.github.io/repo/og-default.png');
  });

  it('leaves already-absolute URLs (Shopify CDN) alone', async () => {
    const { toAbsolute } = await load('/repo');
    expect(toAbsolute(new URL('https://user.github.io'), 'https://cdn.shopify.com/a.jpg')).toBe('https://cdn.shopify.com/a.jpg');
  });

  it('prefixes root links in rendered markdown but not protocol-relative or external ones', async () => {
    const { withBaseInHtml } = await load('/repo');
    const html = '<a href="/waiver/">a</a> <a href="//cdn.test/x">b</a> <a href="https://x.test/">c</a>';
    expect(withBaseInHtml(html)).toBe('<a href="/repo/waiver/">a</a> <a href="//cdn.test/x">b</a> <a href="https://x.test/">c</a>');
  });
});
