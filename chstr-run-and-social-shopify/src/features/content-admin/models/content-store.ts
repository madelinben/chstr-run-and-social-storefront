/** One file change inside a single commit. Exactly one of `text`, `base64` or `remove` is set. */
export type FileChange = { path: string; text: string } | { path: string; base64: string } | { path: string; remove: true };

/**
 * Where site content is read from and saved to. The admin only talks to this interface, so the GitHub
 * implementation can be swapped (a Cloudflare worker, a database) without touching the screens.
 */
export interface ContentStore {
  readText(path: string): Promise<string | undefined>;
  /** File names (not paths) directly inside a folder. Empty when the folder does not exist. */
  listFiles(directory: string): Promise<string[]>;
  /** Save every change as one commit, so the site never builds from half an edit. */
  commit(message: string, changes: readonly FileChange[]): Promise<void>;
}

/**
 * Who is allowed to edit. Today: a GitHub token typed into the page. Later this is the seam for Google sign-in
 * or Cloudflare Access: implement this interface and pass it to the admin; no screen changes.
 */
export interface AdminAuth {
  /** Value for the Authorization header, or undefined when signed out. */
  authorizationHeader(): string | undefined;
  signOut(): void;
}
