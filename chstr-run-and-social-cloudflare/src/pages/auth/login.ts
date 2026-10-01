import type { APIRoute } from 'astro';
import { buildGoogleAuthUrl } from '@/services/integrations/google/google-oidc';
import { codeChallenge, LOGIN_COOKIE, newLoginState, sealLoginState } from '@/services/auth/login-state';
import { getServerEnvironment } from '@/services/environment/server-environment';
import { requireSetting } from '@/services/environment/require-setting';
import { safeNextPath } from '@/utilities/safe-next-path';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const env = getServerEnvironment();
  const login = newLoginState(safeNextPath(url.searchParams.get('next')));
  cookies.set(LOGIN_COOKIE, await sealLoginState(login, requireSetting(env.SESSION_SECRET, 'SESSION_SECRET')), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/auth',
    maxAge: 600,
  });
  return redirect(
    buildGoogleAuthUrl({
      clientId: requireSetting(env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      redirectUri: `${env.SITE_ORIGIN}/auth/callback`,
      state: login.state,
      nonce: login.nonce,
      challenge: await codeChallenge(login.verifier),
    }),
  );
};
