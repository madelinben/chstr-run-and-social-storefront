import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '@/services/auth/session';

export const prerender = false;

/** POST only, so a cross-site link or image cannot sign staff out. */
export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/', 303);
};
