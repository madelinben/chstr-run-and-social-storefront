import { env } from 'cloudflare:workers';
import type { DatabaseBinding } from '@/services/db/orders-database';

export interface ServerEnvironment {
  DB: DatabaseBinding;
  SITE_ORIGIN: string;
  /** Comma-separated provider ids, first is the default: "stripe" or "stripe,sumup". See docs/PAYMENTS.md. */
  PAYMENT_PROVIDERS: string;
  /** Provider credentials are optional here: each provider demands its own via requireSetting. */
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  MOCK_PAYMENT_SECRET?: string;
  RESEND_API_KEY: string;
  NOTIFICATION_FROM_EMAIL: string;
  STAFF_NOTIFICATION_EMAIL: string;
  /** Staff sign-in: Google OIDC (docs/AUTH.md). ADMIN_EMAILS is a comma-separated allow-list. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  ADMIN_EMAILS?: string;
}

export function getServerEnvironment(): ServerEnvironment {
  return env as unknown as ServerEnvironment;
}
