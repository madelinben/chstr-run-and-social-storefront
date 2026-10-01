import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { codeChallenge, newLoginState, openLoginState, sealLoginState } from '@/services/auth/login-state';
import { createSessionToken, readSessionToken } from '@/services/auth/session';

const secret = 'a'.repeat(32);

describe('session token', () => {
  it('round-trips the email', async () => {
    expect(await readSessionToken(await createSessionToken('staff@example.com', secret), secret)).toBe('staff@example.com');
  });

  it('rejects a token signed with another secret, a mangled token, and no token', async () => {
    const token = await createSessionToken('staff@example.com', secret);
    expect(await readSessionToken(token, 'b'.repeat(32))).toBeNull();
    expect(await readSessionToken(`${token}x`, secret)).toBeNull();
    expect(await readSessionToken(undefined, secret)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const expired = await new SignJWT({ email: 'staff@example.com' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('-1m').sign(new TextEncoder().encode(secret));
    expect(await readSessionToken(expired, secret)).toBeNull();
  });

  it('rejects an unsigned (alg none) token', async () => {
    const none = `${btoa('{"alg":"none"}')}.${btoa('{"email":"staff@example.com"}')}.`;
    expect(await readSessionToken(none, secret)).toBeNull();
  });
});

describe('login state', () => {
  it('round-trips and rejects tampering', async () => {
    const login = newLoginState('/admin/orders');
    const sealed = await sealLoginState(login, secret);
    expect(await openLoginState(sealed, secret)).toEqual(login);
    expect(await openLoginState(sealed, 'b'.repeat(32))).toBeNull();
    expect(await openLoginState(undefined, secret)).toBeNull();
  });

  it('issues fresh random values each time', () => {
    const [first, second] = [newLoginState('/'), newLoginState('/')];
    expect(first.state).not.toBe(second.state);
    expect(first.verifier.length).toBeGreaterThanOrEqual(43);
  });

  it('computes the RFC 7636 PKCE challenge', async () => {
    expect(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
