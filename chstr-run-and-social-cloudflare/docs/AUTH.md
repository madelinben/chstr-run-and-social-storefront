# Staff sign-in — Google OIDC

`/admin/*`, `/keystatic/*` and `/api/keystatic/*` are staff-only. Staff sign in with Google; there are no passwords and no user table. Free: Google Cloud OAuth clients cost nothing.

## Flow (authorization code + PKCE)

```
GET /admin/orders (no session)  → middleware 302 → /auth/login?next=/admin/orders
/auth/login     → new state, nonce, PKCE verifier → sealed in a 10-min signed cookie → 302 to Google
Google          → user picks account → 302 /auth/callback?code&state
/auth/callback  → state must match the cookie → registry google.completeSignIn:
                    exchange code (+ verifier + client secret) → ID token
                    verify signature (Google JWKS), issuer, audience, expiry, nonce, email_verified
                → email must be in ADMIN_EMAILS → session cookie (8 h) → 302 next
every protected request → middleware verifies the cookie and re-checks ADMIN_EMAILS
POST /auth/logout → clears the cookie
```

| Path | Role |
|---|---|
| `src/middleware.ts` | Gate. Prefix list `PROTECTED_PREFIXES`: new admin pages are protected by default |
| `src/pages/auth/{login,callback,logout}.ts` | The three endpoints |
| `services/integrations/google/google-oidc.ts` | Only code that talks to Google (registry op `google.completeSignIn`) |
| `services/auth/` | Session token, login-state cookie, PKCE |
| `domain/admin/admin-allow-list.ts` | Pure allow-list check |

## Security properties

- PKCE + `state` + `nonce`: a stolen or replayed code or token cannot complete a login.
- ID token verified fully; an unverified Google email is refused.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` on https. Session is a signed JWT (HS256, `SESSION_SECRET`), 8 hours, no server state.
- Allow-list checked on every request: remove an address from `ADMIN_EMAILS` and that person loses access on their next click. A valid Google account that is not listed gets 403.
- `next` is restricted to same-site paths (no open redirect). Non-GET requests also need a same-origin `Origin` header. Logout is POST only.
- Secrets are read through `requireSetting`; they never appear in logs or errors.

## One-time setup (Google Cloud Console, free)

1. console.cloud.google.com → create a project (e.g. `chstr-run-and-social`).
2. **APIs & Services → OAuth consent screen**: user type **External**, app name, support email. Scopes: `openid`, `email` (non-sensitive, no Google review needed). Publishing status **In production** so staff outside your test list can sign in (testing mode caps at 100 listed users and expires tokens in 7 days).
3. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URIs: `https://www.<domain>/auth/callback` and, for local, `http://localhost:4321/auth/callback`. Use separate clients for production and local if you prefer.
   - No JavaScript origins needed.
4. Copy the client ID and secret. Set:
   - local `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (`openssl rand -hex 32`), `ADMIN_EMAILS`, `SITE_ORIGIN=http://localhost:4321`
   - production: `wrangler secret put` for the same four (use a different `SESSION_SECRET`), and `SITE_ORIGIN=https://www.<domain>`
5. `ADMIN_EMAILS` = comma-separated staff Google addresses. Any Google account works, including a personal Gmail.

Changing `SESSION_SECRET` signs everyone out.

## Add or remove staff

Edit `ADMIN_EMAILS` and redeploy or re-run `wrangler secret put ADMIN_EMAILS`. No other change.

## Keystatic (`/keystatic`)

The Google gate sits in front of the Keystatic UI and its API. Keystatic also signs in to GitHub with its own GitHub app, because it commits content as that GitHub user. So an editor needs: a Google address on `ADMIN_EMAILS` and write access to the repo. Google decides who may open the editor; GitHub decides who may commit.

## Limits

- Single role: every allow-listed address can do everything on `/admin`. Roles would need a `role` per email in the allow-list.
- No session revocation list; the 8-hour expiry and the allow-list re-check are the revocation levers.
- Google is the only identity provider. A second one (GitHub, Microsoft) would mean generalising `google.completeSignIn` the way `PaymentProvider` generalises payments.
- The Google token exchange and sign-in callback were verified with signed test tokens and mocked redirects. A real round trip needs real client credentials and has not been run.
