import type { ContentStore, FileChange } from '@/features/content-admin/models/content-store';

export interface GithubTarget {
  /** `owner/name` */
  repository: string;
  branch: string;
  /** Folder of the app inside the repository, with a trailing slash, or empty at the repository root. */
  root: string;
}

const API = 'https://api.github.com';

/** Saves content straight to the repository with the GitHub REST API. One commit per save; the deploy workflow publishes it. */
export function createGithubStore(target: GithubTarget, authorization: () => string | undefined): ContentStore {
  const repoPath = (path: string) => `${target.root}${path}`;

  async function call(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<Response> {
    const header = authorization();
    if (!header) throw new Error('You are signed out.');
    const response = await fetch(`${API}/repos/${target.repository}${path}`, {
      ...init,
      headers: { Authorization: header, Accept: init.raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (response.status === 401) throw new Error('GitHub rejected the token. Check it has not expired.');
    if (response.status === 403) throw new Error('GitHub refused the request. The token needs read and write access to repository contents.');
    return response;
  }

  async function json(path: string, init?: RequestInit): Promise<unknown> {
    const response = await call(path, init);
    if (!response.ok) throw new Error(`GitHub error ${response.status} for ${path}`);
    return response.json();
  }

  const shaOf = (value: unknown): string => {
    if (typeof value === 'object' && value !== null && 'sha' in value && typeof value.sha === 'string') return value.sha;
    throw new Error('Unexpected reply from GitHub.');
  };

  return {
    async readText(path) {
      const response = await call(`/contents/${repoPath(path)}?ref=${target.branch}`, { raw: true });
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`GitHub error ${response.status} reading ${path}`);
      return response.text();
    },

    async listFiles(directory) {
      const response = await call(`/contents/${repoPath(directory)}?ref=${target.branch}`);
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`GitHub error ${response.status} listing ${directory}`);
      const entries: unknown = await response.json();
      if (!Array.isArray(entries)) return [];
      return entries.flatMap((entry: unknown) => (typeof entry === 'object' && entry !== null && 'name' in entry && 'type' in entry && entry.type === 'file' && typeof entry.name === 'string' ? [entry.name] : []));
    },

    async commit(message, changes: readonly FileChange[]) {
      const headSha = shaOf(await json(`/git/ref/heads/${target.branch}`).then((ref) => (typeof ref === 'object' && ref !== null && 'object' in ref ? ref.object : undefined)));
      const baseTree = await json(`/git/commits/${headSha}`).then((commit) => (typeof commit === 'object' && commit !== null && 'tree' in commit ? shaOf(commit.tree) : ''));
      const tree = await Promise.all(
        changes.map(async (change) => {
          const path = repoPath(change.path);
          if ('remove' in change) return { path, mode: '100644', type: 'blob', sha: null };
          const body = 'text' in change ? { content: change.text, encoding: 'utf-8' } : { content: change.base64, encoding: 'base64' };
          return { path, mode: '100644', type: 'blob', sha: shaOf(await json('/git/blobs', { method: 'POST', body: JSON.stringify(body) })) };
        }),
      );
      const newTree = shaOf(await json('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: baseTree, tree }) }));
      const newCommit = shaOf(await json('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree, parents: [headSha] }) }));
      await json(`/git/refs/heads/${target.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit }) });
    },
  };
}

/** A fine-grained token typed by the editor. Kept in memory only: closing the tab signs out. */
export function createTokenAuth(token: string) {
  let current: string | undefined = token.trim() || undefined;
  return {
    authorizationHeader: () => (current ? `Bearer ${current}` : undefined),
    signOut: () => {
      current = undefined;
    },
  };
}
