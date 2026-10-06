#!/usr/bin/env node
// One-off: turns your Dev Dashboard app's client id/secret into a PUBLIC Storefront access token.
// Reads secrets from .env.admin (gitignored), never from the command line, and prints only the public token.
//
//   .env.admin:  SHOPIFY_STORE_DOMAIN=<handle>.myshopify.com
//                SHOPIFY_CLIENT_ID=...
//                SHOPIFY_CLIENT_SECRET=...
//   run:         node scripts/create-storefront-token.mjs
import { readFileSync } from 'node:fs';

const API_VERSION = '2026-07';
const TOKEN_TITLE = 'CHSTR website';

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
    );
  } catch {
    return null;
  }
}

const env = readEnvFile('.env.admin');
if (!env) {
  console.error('Missing .env.admin. Create it next to package.json with SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (see the header of this script).');
  process.exit(1);
}
const { SHOPIFY_STORE_DOMAIN: domain, SHOPIFY_CLIENT_ID: clientId, SHOPIFY_CLIENT_SECRET: clientSecret } = env;
for (const [name, value] of Object.entries({ SHOPIFY_STORE_DOMAIN: domain, SHOPIFY_CLIENT_ID: clientId, SHOPIFY_CLIENT_SECRET: clientSecret })) {
  if (!value) {
    console.error(`.env.admin is missing ${name}.`);
    process.exit(1);
  }
}
if (!/^[a-z0-9-]+\.myshopify\.com$/.test(domain)) {
  console.error(`SHOPIFY_STORE_DOMAIN must look like your-store.myshopify.com, got "${domain}".`);
  process.exit(1);
}

async function post(url, body, headers = {}) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { ok: response.ok, status: response.status, json, text };
}

// 1. Client-credentials exchange: a short-lived Admin API token for this app on this store.
const exchange = await post(`https://${domain}/admin/oauth/access_token`, { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' });
if (!exchange.ok || !exchange.json?.access_token) {
  console.error(`Could not get an Admin API token (HTTP ${exchange.status}). Check that the app is released and INSTALLED on ${domain}, and that the client id/secret are right.`);
  console.error(String(exchange.json?.error_description ?? exchange.json?.error ?? exchange.text).slice(0, 300));
  process.exit(1);
}
const adminToken = exchange.json.access_token;
console.log(`Admin API scopes granted to the app: ${exchange.json.scope || '(none listed)'}`);

const admin = (query, variables) => post(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, { query, variables }, { 'X-Shopify-Access-Token': adminToken });

// 2. Reuse a token this script made earlier rather than piling up new ones.
const existing = await admin(`{ shop { storefrontAccessTokens(first: 50) { nodes { title accessToken accessScopes { handle } } } } }`);
const found = existing.json?.data?.shop?.storefrontAccessTokens?.nodes?.find((node) => node.title === TOKEN_TITLE);

let token = found;
if (!token) {
  // 3. Mint a public Storefront token. It inherits the app's unauthenticated_* scopes.
  const created = await admin(
    `mutation($input: StorefrontAccessTokenInput!) { storefrontAccessTokenCreate(input: $input) { storefrontAccessToken { title accessToken accessScopes { handle } } userErrors { message } } }`,
    { input: { title: TOKEN_TITLE } },
  );
  const errors = [...(created.json?.errors ?? []).map((error) => error.message), ...(created.json?.data?.storefrontAccessTokenCreate?.userErrors ?? []).map((error) => error.message)];
  token = created.json?.data?.storefrontAccessTokenCreate?.storefrontAccessToken;
  if (!token) {
    console.error(`Could not create a Storefront token (HTTP ${created.status}).`);
    console.error(errors.join('\n') || created.text.slice(0, 300));
    console.error('If this mentions scopes: open the app in the Dev Dashboard, add the four unauthenticated_* Storefront scopes, release a new version and reinstall.');
    process.exit(1);
  }
}

console.log(`\nStorefront token "${token.title}" ${found ? '(already existed)' : '(created)'} with scopes: ${token.accessScopes.map((scope) => scope.handle).join(', ') || '(none)'}`);
console.log('\nThis token is public by design (it ships in the browser). Put these in .env.local:\n');
console.log(`PUBLIC_SHOPIFY_STORE_DOMAIN=${domain}`);
console.log(`PUBLIC_SHOPIFY_STOREFRONT_TOKEN=${token.accessToken}`);
