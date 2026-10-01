import { defineMiddleware } from 'astro/middleware';
import { getServerEnvironment } from '@/services/environment/server-environment';
import { requireSetting } from '@/services/environment/require-setting';
import { isAdminEmail } from '@/domain/admin/admin-allow-list';
import { readSessionToken, SESSION_COOKIE } from '@/services/auth/session';

/** Everything staff-only. Matches are by prefix so a new admin page is protected by default. */
const PROTECTED_PREFIXES = ['/admin', '/keystatic', '/api/keystatic'];

const isProtected = (pathname: string) => PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, origin } = context.url;
  if (!isProtected(pathname)) return next();

  const env = getServerEnvironment();
  const email = await readSessionToken(context.cookies.get(SESSION_COOKIE)?.value, requireSetting(env.SESSION_SECRET, 'SESSION_SECRET'));
  // Re-checked on every request, so removing an address from ADMIN_EMAILS locks that person out immediately.
  if (!email || !isAdminEmail(email, env.ADMIN_EMAILS)) {
    if (context.request.method !== 'GET') return new Response('Sign in required.', { status: 401 });
    return context.redirect(`/auth/login?next=${encodeURIComponent(pathname + context.url.search)}`);
  }

  // Cookies are SameSite=Lax, which already blocks cross-site POSTs; this is the second lock.
  const requestOrigin = context.request.headers.get('origin');
  if (!['GET', 'HEAD'].includes(context.request.method) && requestOrigin && requestOrigin !== origin) {
    return new Response('Cross-site request refused.', { status: 403 });
  }

  context.locals.adminEmail = email;
  return next();
});
