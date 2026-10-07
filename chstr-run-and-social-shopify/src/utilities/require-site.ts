/** Astro types `site` as optional. It is set in astro.config.mjs; fail loudly here instead of asserting non-null at every use. */
export function requireSite(site: URL | undefined): URL {
  if (!site) throw new Error('`site` is missing in astro.config.mjs (set SITE_ORIGIN).');
  return site;
}
