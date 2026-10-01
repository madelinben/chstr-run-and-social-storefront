// zod/mini: this file ships to the browser (cart), and full zod is ~20 KB gz (performance.mdc).
import * as z from 'zod/mini';

/** Pinned in one place. Bump deliberately, then re-run the e2e checkout test. */
export const STOREFRONT_API_VERSION = '2026-07';

function endpoint() {
  const override = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_URL;
  if (override) return override;
  const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error('PUBLIC_SHOPIFY_STORE_DOMAIN is not set (see docs/environment/shopify.md).');
  return `https://${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`;
}

const envelopeSchema = z.object({
  data: z.optional(z.unknown()),
  errors: z.optional(z.array(z.object({ message: z.string() }))),
});

/** One typed entry point to the Storefront GraphQL API. Parses every response with the caller's schema. */
export async function storefrontRequest<Schema extends z.ZodMiniType>(
  query: string,
  variables: Record<string, unknown>,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Storefront API responded ${response.status}.`);
  const envelope = envelopeSchema.parse(await response.json());
  if (envelope.errors?.length) throw new Error(envelope.errors.map((error) => error.message).join('; '));
  return schema.parse(envelope.data);
}
