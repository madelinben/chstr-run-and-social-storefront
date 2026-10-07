import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGithubStore, createTokenAuth } from '@/features/content-admin/utilities/github-store';
import { faqSlug, parseFaq, serializeFaq } from '@/features/content-admin/utilities/faq-file';

const target = { repository: 'club/site', branch: 'main', root: 'app/' };

afterEach(() => vi.unstubAllGlobals());

describe('github store commit', () => {
  it('makes one commit with every file, under the app folder', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: RequestInit) => {
        calls.push({ url, method: init.method ?? 'GET', body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined });
        const reply = url.includes('/git/ref/') ? { object: { sha: 'head' } } : url.includes('/git/commits/head') ? { tree: { sha: 'base' } } : { sha: `sha-${calls.length}` };
        return Promise.resolve(new Response(JSON.stringify(reply), { status: 200 }));
      }),
    );
    const store = createGithubStore(target, createTokenAuth('abc').authorizationHeader);
    await store.commit('Edit content', [{ path: 'src/a.json', text: '{}' }, { path: 'src/b.webp', base64: 'AAAA' }, { path: 'src/old.md', remove: true }]);

    const tree = calls.find((call) => call.url.endsWith('/git/trees'));
    expect(tree?.body).toMatchObject({ base_tree: 'base', tree: [{ path: 'app/src/a.json' }, { path: 'app/src/b.webp' }, { path: 'app/src/old.md', sha: null }] });
    expect(calls.filter((call) => call.url.endsWith('/git/blobs'))).toHaveLength(2);
    expect(calls.at(-1)).toMatchObject({ method: 'PATCH', url: expect.stringContaining('/git/refs/heads/main') });
  });

  it('refuses to call GitHub when signed out', async () => {
    const auth = createTokenAuth('abc');
    auth.signOut();
    await expect(createGithubStore(target, auth.authorizationHeader).readText('x')).rejects.toThrow('signed out');
  });
});

describe('faq files', () => {
  it('round-trips a question with a colon and quotes', () => {
    const faq = { slug: 'a', question: 'Is it "free": really?', position: 3, answer: 'Yes.' };
    expect(parseFaq('a', serializeFaq(faq))).toEqual(faq);
  });

  it('reads the existing unquoted style', () => {
    expect(parseFaq('x', '---\nquestion: What happens after the run?\nposition: 10\n---\n\nA drink.\n')).toEqual({ slug: 'x', question: 'What happens after the run?', position: 10, answer: 'A drink.' });
  });

  it('makes a clean slug', () => {
    expect(faqSlug("Can I bring my dog? It's small!")).toBe('can-i-bring-my-dog-it-s-small');
  });
});
