/**
 * The site may live under a sub-path (GitHub Pages project sites: /<repo>/). Every internal URL goes through here.
 * BASE_URL is "/" at a domain root, "/repo" or "/repo/" under a base: normalise both.
 */
const basePath = () => import.meta.env.BASE_URL.replace(/\/$/, '');

/** `/faqs/` becomes `/repo/faqs/` under a base, and stays `/faqs/` at a root. */
export function withBase(path: string): string {
  return `${basePath()}${path}`;
}

/** The site's root as an absolute URL ending in a slash, e.g. `https://user.github.io/repo/`. */
export function siteRoot(site: URL): string {
  return new URL(`${basePath()}/`, site).href;
}

/** An absolute URL for an internal path, or the URL itself when it is already absolute (e.g. Shopify CDN images). */
export function toAbsolute(site: URL, pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : new URL(`${basePath()}${pathOrUrl}`, site).href;
}

/** Rendered markdown holds plain site links (`href="/waiver/"`). Under a base they need the prefix too. */
export function withBaseInHtml(html: string): string {
  const prefix = basePath();
  return prefix ? html.replace(/href="\/(?!\/)/g, `href="${prefix}/`) : html;
}
