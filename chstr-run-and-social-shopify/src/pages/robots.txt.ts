import { requireSite } from '@/utilities/require-site';
import type { APIRoute } from 'astro';
import { toAbsolute } from '@/utilities/with-base';

const noindex = import.meta.env.PUBLIC_SITE_NOINDEX === '1';

export const GET: APIRoute = ({ site }) =>
  new Response(
    (noindex
      ? ['User-agent: *', 'Disallow: /', '']
      : ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /keystatic', 'Disallow: /api/', 'Disallow: /auth/', '', `Sitemap: ${toAbsolute(requireSite(site), '/sitemap-index.xml')}`, '']
    ).join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
