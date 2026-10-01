import { generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGoogleAuthUrl, verifyGoogleIdToken } from '@/services/integrations/google/google-oidc';

const clientId = 'client-123';
const nonce = 'nonce-abc';
let privateKey: CryptoKey;
let publicKey: CryptoKey;

beforeAll(async () => {
  ({ privateKey, publicKey } = await generateKeyPair('RS256'));
});

const keys = async () => publicKey;

function sign(claims: Record<string, unknown>, options: { issuer?: string; audience?: string; expires?: string } = {}) {
  return new SignJWT({ nonce, email: 'staff@example.com', email_verified: true, ...claims })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(options.issuer ?? 'https://accounts.google.com')
    .setAudience(options.audience ?? clientId)
    .setExpirationTime(options.expires ?? '5m')
    .sign(privateKey);
}

describe('verifyGoogleIdToken', () => {
  it('accepts a valid token and returns the email', async () => {
    expect(await verifyGoogleIdToken(await sign({}), { clientId, nonce }, keys)).toEqual({ email: 'staff@example.com' });
  });

  it('rejects a wrong nonce (replayed token)', async () => {
    await expect(verifyGoogleIdToken(await sign({ nonce: 'other' }), { clientId, nonce }, keys)).rejects.toThrow('nonce');
  });

  it('rejects another app\'s token (audience), a foreign issuer, and an expired token', async () => {
    await expect(verifyGoogleIdToken(await sign({}, { audience: 'someone-else' }), { clientId, nonce }, keys)).rejects.toThrow();
    await expect(verifyGoogleIdToken(await sign({}, { issuer: 'https://evil.example' }), { clientId, nonce }, keys)).rejects.toThrow();
    await expect(verifyGoogleIdToken(await sign({}, { expires: '-1m' }), { clientId, nonce }, keys)).rejects.toThrow();
  });

  it('rejects an unverified email', async () => {
    await expect(verifyGoogleIdToken(await sign({ email_verified: false }), { clientId, nonce }, keys)).rejects.toThrow('verified');
  });

  it('rejects a token signed by a different key', async () => {
    const other = await generateKeyPair('RS256');
    const forged = await new SignJWT({ nonce, email: 'staff@example.com', email_verified: true }).setProtectedHeader({ alg: 'RS256' }).setIssuer('https://accounts.google.com').setAudience(clientId).setExpirationTime('5m').sign(other.privateKey);
    await expect(verifyGoogleIdToken(forged, { clientId, nonce }, keys)).rejects.toThrow();
  });
});

describe('buildGoogleAuthUrl', () => {
  it('requests the code flow with PKCE, state and nonce', () => {
    const url = new URL(buildGoogleAuthUrl({ clientId, redirectUri: 'https://x.test/auth/callback', state: 's', nonce, challenge: 'c' }));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ response_type: 'code', scope: 'openid email', code_challenge_method: 'S256', code_challenge: 'c', state: 's', nonce, redirect_uri: 'https://x.test/auth/callback' });
  });
});
