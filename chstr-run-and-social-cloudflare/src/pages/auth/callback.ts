import type { APIRoute } from 'astro';
import { isAdminEmail } from '@/domain/admin/admin-allow-list';
import { runOperation } from '@/services/integrations/registry';
import { LOGIN_COOKIE, openLoginState } from '@/services/auth/login-state';
import { createSessionToken, SESSION_COOKIE, SESSION_HOURS } from '@/services/auth/session';
import { getServerEnvironment } from '@/services/environment/server-environment';
import { requireSetting } from '@/services/environment/require-setting';
import { safeNextPath } from '@/utilities/safe-next-path';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const env = getServerEnvironment();
  const secret = requireSetting(env.SESSION_SECRET, 'SESSION_SECRET');
  const login = await openLoginState(cookies.get(LOGIN_COOKIE)?.value, secret);
  cookies.delete(LOGIN_COOKIE, { path: '/auth' });

  const code = url.searchParams.get('code');
  if (!login || !code || url.searchParams.get('state') !== login.state) {
    return new Response('Sign-in expired or invalid. Start again from /auth/login.', { status: 400 });
  }

  let email: string;
  try {
    ({ email } = await runOperation('google.completeSignIn', { code, verifier: login.verifier, nonce: login.nonce, redirectUri: `${env.SITE_ORIGIN}/auth/callback` }, env));
  } catch (error) {
    console.error('Google sign-in failed.', error);
    return new Response('Google sign-in failed. Start again from /auth/login.', { status: 400 });
  }
  if (!isAdminEmail(email, env.ADMIN_EMAILS)) return new Response('This Google account is not on the staff list.', { status: 403 });

  cookies.set(SESSION_COOKIE, await createSessionToken(email, secret), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  return redirect(safeNextPath(login.next));
};
