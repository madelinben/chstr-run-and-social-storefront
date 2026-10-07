#!/usr/bin/env node
// Enforces .cursor/rules/seo.mdc and performance.mdc against the BUILT site. Run after `pnpm build`.
// Same file in both CHSTR repos. Change a limit here and in the rule in one commit.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'node-html-parser';

const DIST = existsSync('dist/client') ? 'dist/client' : 'dist';
const BUDGET = { jsGzip: 100 * 1024, cssGzip: 20 * 1024, htmlGzip: 25 * 1024, htmlRaw: 80 * 1024, fontFiles: 2, fontBytes: 100 * 1024, imageBytes: 200 * 1024 };
const TITLE = { min: 15, max: 60 };
const DESCRIPTION = { min: 70, max: 160 };
const ALLOWED_ASSET_ORIGINS = ['cdn.shopify.com'];
const DYNAMIC_PREFIXES = ['/admin', '/auth', '/keystatic', '/api'];

// Sub-path hosting (GitHub Pages) and prototype noindex mode come from the same env vars the build used.
const BASE = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const NOINDEX_MODE = process.env.PUBLIC_SITE_NOINDEX === '1';
const stripBase = (path) => (BASE && path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path);

const errors = [];
const fail = (route, message) => errors.push(`${route}  ${message}`);
const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
}

const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));
const routeOf = (file) => {
  const path = '/' + relative(DIST, file).replaceAll('\\', '/');
  if (path === '/404.html') return path;
  return path.replace(/index\.html$/, '');
};
const distPath = (urlPath) => join(DIST, decodeURIComponent(stripBase(urlPath.split(/[?#]/)[0])));

// ---- JS graph: everything a page loads, including static imports of each chunk ----
const staticImport = /(?:\bfrom|\bimport)\s*["']([^"']+\.m?js)["']/g;
function jsClosure(entries, route) {
  const seen = new Map();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    if (!existsSync(file)) {
      fail(route, `referenced script not found: ${relative(DIST, file)}`);
      continue;
    }
    const code = readFileSync(file);
    seen.set(file, gz(code));
    for (const match of code.toString('utf8').matchAll(staticImport)) {
      if (match[1].startsWith('.')) queue.push(resolve(dirname(file), match[1]));
      else if (match[1].startsWith('/')) queue.push(distPath(match[1]));
    }
  }
  return seen;
}

const pages = [];
for (const file of htmlFiles) {
  const route = routeOf(file);
  const raw = readFileSync(file);
  const root = parse(raw.toString('utf8'));
  const meta = (selector) => root.querySelector(selector)?.getAttribute('content') ?? '';
  const robots = meta('meta[name="robots"]');
  const noindex = /noindex/.test(robots);
  pages.push({ route, file, raw, root, meta, noindex, canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '' });
}

const home = pages.find((page) => page.route === '/');
if (!home) fail('/', 'home page missing from build');
// Falls back to og:url so a missing canonical is reported as a problem, not a crash.
const originSource = home?.canonical || home?.meta('meta[property="og:url"]') || 'http://localhost:4321/';
const origin = new URL(originSource).origin;
if (process.env.SEO_STRICT === '1' && /localhost|127\.0\.0\.1|\.example|\.invalid|\.test/.test(origin)) {
  fail('/', `SEO_STRICT=1 but the site origin is a placeholder: ${origin}. Set SITE_ORIGIN for the production build.`);
}

const summary = [];
// Which indexable pages are linked from another page (orphan check), and per-template size measurements (baseline check).
const linkedFrom = new Map();
const measurements = new Map();
const templateOf = (route) => {
  if (/^\/merchandise\/[^/]+\/$/.test(route)) return '/merchandise/:product/';
  if (/^\/events\/(?!past\/)[^/]+\/$/.test(route)) return '/events/:event/';
  return route;
};
const slugify = (text) => text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const warnings = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
const seenH1s = new Map();
const unique = (map, value, route, label) => {
  if (map.has(value)) fail(route, `duplicate ${label} also on ${map.get(value)}: "${value}"`);
  else map.set(value, route);
};

for (const page of pages) {
  const { route, root, raw, noindex, meta, canonical } = page;

  // ---- head basics (every page, indexed or not) ----
  if (root.querySelector('html')?.getAttribute('lang') !== 'en-GB') fail(route, '<html lang> must be en-GB');
  const viewport = root.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
  if (viewport !== 'width=device-width, initial-scale=1') fail(route, `viewport must be "width=device-width, initial-scale=1", got "${viewport}"`);
  // HTTPS only: no insecure sub-resource or link URLs. Local http://localhost builds are exempt.
  if (!/^http:\/\/localhost/.test(origin)) {
    for (const node of root.querySelectorAll('[src],[href],[srcset],[action],meta[content]')) {
      for (const attribute of ['src', 'href', 'srcset', 'action', 'content']) {
        const value = node.getAttribute(attribute);
        if (value && /(^|[\s,])http:\/\//.test(value)) fail(route, `insecure http:// URL in ${attribute}: ${value.slice(0, 80)}`);
      }
    }
  }
  if (route === '/' && process.env.PUBLIC_GOOGLE_SITE_VERIFICATION && meta('meta[name="google-site-verification"]') !== process.env.PUBLIC_GOOGLE_SITE_VERIFICATION) {
    fail(route, 'PUBLIC_GOOGLE_SITE_VERIFICATION is set but the home page has no matching google-site-verification meta tag');
  }
  if (!root.querySelector('link[rel="icon"][type="image/svg+xml"]')) fail(route, 'missing SVG favicon');
  if (!root.querySelector('link[rel="apple-touch-icon"]')) fail(route, 'missing apple-touch-icon');

  const title = root.querySelector('title')?.text.trim() ?? '';
  const description = meta('meta[name="description"]');
  if (title.length < TITLE.min || title.length > TITLE.max) fail(route, `title is ${title.length} chars (limit ${TITLE.min}-${TITLE.max}): "${title}"`);
  if (description.length < DESCRIPTION.min || description.length > DESCRIPTION.max) fail(route, `meta description is ${description.length} chars (limit ${DESCRIPTION.min}-${DESCRIPTION.max})`);
  if (!meta('meta[name="robots"]')) fail(route, 'missing meta robots');
  if (route !== '/404.html' && !canonical) fail(route, 'missing canonical');

  if (noindex) {
    if (!/nofollow/.test(meta('meta[name="robots"]'))) fail(route, 'noindex page should also be nofollow');
  } else {
    // ---- indexable pages: canonical, social, schema ----
    if (root.querySelectorAll('link[rel="canonical"]').length !== 1) fail(route, 'needs exactly one canonical');
    if (canonical && canonical !== new URL(BASE + route, origin).href) fail(route, `canonical ${canonical} must equal ${new URL(BASE + route, origin).href}`);
    unique(seenTitles, title, route, 'title');
    unique(seenDescriptions, description, route, 'description');

    const og = (name) => meta(`meta[property="og:${name}"]`);
    for (const name of ['title', 'description', 'type', 'url', 'image', 'image:alt', 'site_name', 'locale']) if (!og(name)) fail(route, `missing og:${name}`);
    if (og('url') !== canonical) fail(route, 'og:url must equal canonical');
    if (og('title') !== title) fail(route, 'og:title must equal the page title');
    if (og('locale') !== 'en_GB') fail(route, 'og:locale must be en_GB');
    const ogImage = og('image');
    if (ogImage && !/^https?:\/\//.test(ogImage)) fail(route, 'og:image must be an absolute URL');
    if (/\.svg(\?|$)/.test(ogImage)) fail(route, 'og:image must not be an SVG');
    if (ogImage.startsWith(origin)) {
      const local = distPath(new URL(ogImage).pathname);
      if (!existsSync(local)) fail(route, `og:image file missing in build: ${ogImage}`);
      else if (local.endsWith('.png')) {
        const png = readFileSync(local);
        const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
        if (width < 1200 || height < 630) fail(route, `og:image is ${width}x${height}, needs at least 1200x630`);
        if (png.length > BUDGET.imageBytes) fail(route, `og:image is ${kb(png.length)} (limit ${kb(BUDGET.imageBytes)})`);
      }
    }
    if (meta('meta[name="twitter:card"]') !== 'summary_large_image') fail(route, 'twitter:card must be summary_large_image');

    checkSchema(page, title);
  }

  // ---- headings ----
  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6').map((node) => ({ level: Number(node.tagName[1]), text: node.text.trim() }));
  const h1s = headings.filter((heading) => heading.level === 1);
  if (h1s.length !== 1) fail(route, `needs exactly one <h1>, found ${h1s.length}`);
  else if (!noindex) unique(seenH1s, h1s[0].text, route, 'h1');
  headings.reduce((previous, heading) => {
    if (previous && heading.level > previous + 1) fail(route, `heading level jumps from h${previous} to h${heading.level} ("${heading.text}")`);
    return heading.level;
  }, 0);

  // ---- images ----
  const images = root.querySelectorAll('img');
  const nonLazy = [];
  for (const img of images) {
    const src = img.getAttribute('src') ?? '';
    const label = `<img ${src.slice(0, 60)}>`;
    if (!/^\d+$/.test(img.getAttribute('width') ?? '') || !/^\d+$/.test(img.getAttribute('height') ?? '')) fail(route, `${label} needs numeric width and height`);
    const alt = img.getAttribute('alt');
    if (alt === undefined) fail(route, `${label} has no alt attribute`);
    else if (alt.trim() === '' && !img.closest('[aria-hidden="true"]') && img.getAttribute('role') !== 'presentation') {
      // An empty alt is right when the image sits in a link or button that already has its own text.
      const labelled = img.closest('a, button');
      if (!labelled || labelled.text.trim() === '') fail(route, `${label} has empty alt but is not decorative (aria-hidden, role=presentation, or inside a link with text)`);
    }
    if (img.getAttribute('loading') !== 'lazy') nonLazy.push(img);
    if (/^https?:\/\//.test(src)) {
      if (!ALLOWED_ASSET_ORIGINS.includes(new URL(src).hostname) && new URL(src).origin !== origin) fail(route, `${label} comes from a third-party origin`);
    } else if (src.startsWith('/')) {
      const local = distPath(src);
      if (!existsSync(local)) fail(route, `${label} not found in build`);
      else if (statSync(local).size > BUDGET.imageBytes) fail(route, `${label} is ${kb(statSync(local).size)} (limit ${kb(BUDGET.imageBytes)})`);
    }
  }
  if (nonLazy.length > 1) fail(route, `${nonLazy.length} images are not lazy; only the LCP image may be eager`);
  if (nonLazy.length === 1 && nonLazy[0].getAttribute('fetchpriority') !== 'high') fail(route, 'the one eager image must have fetchpriority="high"');

  // ---- third parties and islands ----
  for (const node of root.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="preload"], link[rel="modulepreload"], iframe')) {
    const url = node.getAttribute('src') ?? node.getAttribute('href') ?? '';
    if (/^(https?:)?\/\//.test(url) && !ALLOWED_ASSET_ORIGINS.includes(new URL(url, origin || 'http://x').hostname) && new URL(url, 'http://x').origin !== origin) fail(route, `third-party resource: ${url}`);
  }
  const loadIslands = root.querySelectorAll('astro-island[client="load"]').length;
  if (loadIslands > 0) fail(route, `${loadIslands} island(s) use client:load; use client:idle or client:visible`);

  // ---- internal links ----
  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    if (BASE && !href.startsWith(`${BASE}/`)) {
      fail(route, `internal link ${href} is missing the base path ${BASE} (use withBase)`);
      continue;
    }
    const path = stripBase(href.split(/[?#]/)[0]);
    if (path !== route) linkedFrom.set(path, [...(linkedFrom.get(path) ?? []), route]);
    if (DYNAMIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) continue;
    if (/\.[a-z0-9]+$/i.test(path)) {
      if (!existsSync(distPath(path))) fail(route, `broken link ${href}`);
    } else if (!path.endsWith('/')) fail(route, `internal link ${href} must end with a slash (avoids a redirect hop)`);
    else if (!existsSync(join(distPath(path), 'index.html'))) fail(route, `broken link ${href}`);
  }

  // ---- budgets ----
  const entries = new Set();
  for (const node of root.querySelectorAll('script[type="module"][src], link[rel="modulepreload"]')) entries.add(node.getAttribute('src') ?? node.getAttribute('href'));
  for (const island of root.querySelectorAll('astro-island')) for (const attribute of ['component-url', 'renderer-url', 'before-hydration-url']) if (island.getAttribute(attribute)) entries.add(island.getAttribute(attribute));
  const closure = jsClosure([...entries].filter((url) => url.startsWith('/')).map(distPath), route);
  const inlineJs = root.querySelectorAll('script:not([src]):not([type="application/ld+json"])').reduce((sum, node) => sum + gz(Buffer.from(node.text)), 0);
  const jsBytes = [...closure.values()].reduce((sum, size) => sum + size, 0) + inlineJs;

  const cssFiles = root.querySelectorAll('link[rel="stylesheet"]').map((node) => distPath(node.getAttribute('href')));
  const cssBytes = cssFiles.reduce((sum, file) => sum + (existsSync(file) ? gz(readFileSync(file)) : 0), 0) + root.querySelectorAll('style').reduce((sum, node) => sum + gz(Buffer.from(node.text)), 0);

  const fonts = root.querySelectorAll('link[rel="preload"][as="font"]');
  const fontBytes = fonts.reduce((sum, node) => sum + (existsSync(distPath(node.getAttribute('href'))) ? statSync(distPath(node.getAttribute('href'))).size : 0), 0);
  if (fonts.length === 0) fail(route, 'no preloaded font (preload the Latin variable files)');
  if (fonts.length > BUDGET.fontFiles) fail(route, `${fonts.length} preloaded fonts (limit ${BUDGET.fontFiles})`);
  if (fonts.some((node) => node.getAttribute('crossorigin') === undefined)) fail(route, 'font preload needs crossorigin');
  if (fontBytes > BUDGET.fontBytes) fail(route, `preloaded fonts are ${kb(fontBytes)} (limit ${kb(BUDGET.fontBytes)})`);

  const htmlGzip = gz(raw);
  if (jsBytes > BUDGET.jsGzip) fail(route, `JavaScript is ${kb(jsBytes)} gzip (limit ${kb(BUDGET.jsGzip)})`);
  if (cssBytes > BUDGET.cssGzip) fail(route, `CSS is ${kb(cssBytes)} gzip (limit ${kb(BUDGET.cssGzip)})`);
  if (htmlGzip > BUDGET.htmlGzip || raw.length > BUDGET.htmlRaw) fail(route, `HTML is ${kb(raw.length)} raw / ${kb(htmlGzip)} gzip (limits ${kb(BUDGET.htmlRaw)} / ${kb(BUDGET.htmlGzip)})`);
  const template = templateOf(route);
  const previous = measurements.get(template) ?? { js: 0, css: 0, html: 0 };
  measurements.set(template, { js: Math.max(previous.js, jsBytes), css: Math.max(previous.css, cssBytes), html: Math.max(previous.html, htmlGzip) });
  if (template === '/merchandise/:product/') {
    const title = root.querySelector('h1')?.text.trim() ?? '';
    const slug = route.split('/').filter(Boolean).at(-1);
    if (title && slug !== slugify(title)) warnings.push(`${route}  slug "${slug}" differs from the product title "${title}" (rename the handle in Shopify, which can redirect the old URL)`);
  }
  summary.push({ route, js: kb(jsBytes), css: kb(cssBytes), html: kb(htmlGzip), imgs: images.length, indexed: noindex ? 'no' : 'yes' });
}

// ---- schema.org per page type ----
function checkSchema(page, title) {
  const { route, root } = page;
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  if (scripts.length !== 1) return fail(route, `needs exactly one JSON-LD script holding an @graph, found ${scripts.length}`);
  let data;
  try {
    data = JSON.parse(scripts[0].text);
  } catch {
    return fail(route, 'JSON-LD is not valid JSON');
  }
  if (data['@context'] !== 'https://schema.org') fail(route, 'JSON-LD @context must be https://schema.org');
  const graph = data['@graph'];
  if (!Array.isArray(graph) || graph.length === 0) return fail(route, 'JSON-LD needs a non-empty @graph');
  const typesOf = (node) => [node['@type']].flat();
  const find = (type) => graph.find((node) => typesOf(node).includes(type));
  const ids = new Set();
  for (const node of graph) {
    if (!node['@type']) fail(route, 'JSON-LD node without @type');
    if (node['@id']) {
      if (ids.has(node['@id'])) fail(route, `duplicate JSON-LD @id ${node['@id']}`);
      ids.add(node['@id']);
    }
  }
  for (const node of graph) for (const key of ['publisher', 'isPartOf', 'about', 'breadcrumb', 'organizer', 'seller']) {
    const reference = node[key]?.['@id'];
    if (reference && !ids.has(reference)) fail(route, `JSON-LD ${key} references missing @id ${reference}`);
  }
  const text = root.querySelector('main')?.text.replace(/\s+/g, ' ') ?? '';
  const need = (type, properties = []) => {
    const node = find(type);
    if (!node) return fail(route, `JSON-LD missing ${type}`) ?? null;
    for (const property of properties) if (node[property] === undefined || node[property] === '' || (Array.isArray(node[property]) && node[property].length === 0)) fail(route, `JSON-LD ${type} missing ${property}`);
    return node;
  };

  need('Organization', ['name', 'url', 'logo', 'address']);
  if (!find('SportsClub')) fail(route, 'JSON-LD Organization must also be a SportsClub');
  need('WebSite', ['name', 'url', 'publisher']);
  const pageNode = graph.find((node) => node['@id'] === `${page.canonical}#webpage`);
  if (!pageNode) fail(route, 'JSON-LD missing the WebPage node for this URL');
  else if (pageNode.name !== title) fail(route, 'JSON-LD WebPage name must equal the page title');

  if (route !== '/') {
    const crumbs = need('BreadcrumbList', ['itemListElement']);
    const items = crumbs?.itemListElement ?? [];
    if (items.length < 2) fail(route, 'BreadcrumbList needs Home plus this page');
    else if (items.at(-1).item !== page.canonical) fail(route, 'last breadcrumb must be this page');
  }

  if (route === '/') {
    const event = need('Event', ['name', 'startDate', 'eventSchedule', 'location', 'offers', 'organizer', 'eventStatus', 'eventAttendanceMode']);
    if (event && event.isAccessibleForFree !== true) fail(route, 'Event must set isAccessibleForFree: true');
    if (event && !/^\d{4}-\d{2}-\d{2}T18:30:00[+-]\d{2}:\d{2}$/.test(event.startDate)) fail(route, `Event startDate must be 18:30 with a UTC offset, got ${event.startDate}`);
    if (event && Date.parse(event.startDate) < Date.now() - 36e5) fail(route, 'Event startDate is in the past; rebuild');
  }
  if (route === '/faqs/') {
    const faq = need('FAQPage', ['mainEntity']);
    const visible = root.querySelectorAll('details').length;
    if (faq && faq.mainEntity.length !== visible) fail(route, `FAQPage has ${faq.mainEntity.length} questions but the page shows ${visible}`);
    for (const question of faq?.mainEntity ?? []) if (!text.includes(question.name)) fail(route, `FAQ question not visible on the page: "${question.name}"`);
  }
  if (route === '/contact/' && !find('ContactPage')) fail(route, 'JSON-LD missing ContactPage');
  if (route === '/events/') {
    const events = graph.filter((node) => typesOf(node).includes('Event'));
    if (events.length < 3) fail(route, `JSON-LD needs an Event for each weekly session (run, football, netball), found ${events.length}`);
    for (const event of events) for (const property of ['name', 'startDate', 'eventSchedule', 'location']) if (event[property] === undefined) fail(route, `JSON-LD Event "${event.name}" missing ${property}`);
  }
  if (/^\/events\/(?!past\/)[^/]+\/$/.test(route)) need('Event', ['name', 'startDate', 'description', 'organizer']);
  if (route === '/members/' && graph.filter((node) => typesOf(node).includes('Person')).length < 1) fail(route, 'JSON-LD needs a Person for each leader');
  if (route === '/merchandise/') {
    if (!find('CollectionPage')) fail(route, 'JSON-LD missing CollectionPage');
    // An empty shop (no product links on the page) is a valid state and has no list to describe.
    const productLinks = root.querySelectorAll('main a[href^="/merchandise/"]').filter((anchor) => /^\/merchandise\/[^/]+\/$/.test(anchor.getAttribute('href')));
    const list = productLinks.length === 0 ? null : need('ItemList', ['itemListElement']);
    for (const item of list?.itemListElement ?? []) {
      if (!existsSync(join(distPath(new URL(item.url).pathname), 'index.html'))) fail(route, `ItemList url does not resolve: ${item.url}`);
      if (!item.name || !item.image) fail(route, `ItemList item ${item.position} needs name and image`);
    }
  }
  if (/^\/merchandise\/[^/]+\/$/.test(route)) {
    const product = need('Product', ['name', 'description', 'image', 'offers', 'brand']);
    if (!root.querySelector('meta[property="og:type"][content="product"]')) fail(route, 'product page needs og:type=product');
    for (const offer of [product?.offers ?? []].flat()) {
      for (const property of ['price', 'priceCurrency', 'availability', 'url']) if (!offer[property]) fail(route, `Offer missing ${property}`);
      if (offer.priceCurrency !== 'GBP') fail(route, 'Offer priceCurrency must be GBP');
      const shown = Number(offer.price) === 0 ? 'Free' : `£${Number(offer.price).toFixed(2)}`;
      if (!text.includes(shown)) fail(route, `Offer price ${shown} is not the price shown on the page`);
    }
    for (const image of product?.image ?? []) if (!/^https?:\/\//.test(image)) fail(route, `Product image must be absolute: ${image}`);
  }
}

// ---- site files ----
const indexable = pages.filter((page) => !page.noindex && page.route !== '/404.html');
const robotsFile = join(DIST, 'robots.txt');
if (NOINDEX_MODE) {
  // Prototype preview: nothing may be indexable, robots.txt blocks everything, and there is no sitemap to publish.
  for (const page of pages) if (!page.noindex) fail(page.route, 'PUBLIC_SITE_NOINDEX=1 but this page is indexable');
  if (!existsSync(robotsFile) || !/^Disallow: \/\s*$/m.test(readFileSync(robotsFile, 'utf8'))) fail('/robots.txt', 'noindex mode must Disallow: /');
  if (existsSync(join(DIST, 'sitemap-index.xml'))) fail('/sitemap-index.xml', 'noindex mode must not publish a sitemap');
} else {
  if (!existsSync(robotsFile)) fail('/robots.txt', 'missing');
  else {
    const robots = readFileSync(robotsFile, 'utf8');
    if (!/^Sitemap: https?:\/\//m.test(robots)) fail('/robots.txt', 'needs an absolute Sitemap: line');
    for (const path of ['/admin', '/keystatic', '/api/', '/auth/']) if (!robots.includes(`Disallow: ${path}`)) fail('/robots.txt', `must Disallow ${path}`);
  }
  const sitemapIndex = join(DIST, 'sitemap-index.xml');
  if (!existsSync(sitemapIndex)) fail('/sitemap-index.xml', 'missing');
  else {
    const urls = new Set();
    for (const [, location] of readFileSync(sitemapIndex, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const child = join(DIST, stripBase(new URL(location).pathname));
      if (existsSync(child)) for (const [, url] of readFileSync(child, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(url);
    }
    for (const page of indexable) if (!urls.has(page.canonical)) fail(page.route, 'indexable page missing from the sitemap');
    for (const page of pages.filter((candidate) => candidate.noindex)) if (page.canonical && urls.has(page.canonical)) fail(page.route, 'noindex page must not be in the sitemap');
    for (const url of urls) if (new URL(url).origin !== origin) fail('/sitemap', `sitemap URL on another origin: ${url}`);
  }
}

// ---- internal linking: every indexable page must be reachable from another page ----
for (const page of indexable) if (page.route !== '/' && !linkedFrom.has(page.route)) fail(page.route, 'orphan page: no other page links to it (add an internal link)');

// ---- llms.txt ----
const llms = join(DIST, 'llms.txt');
if (!existsSync(llms)) fail('/llms.txt', 'missing');
else if (!/^# \S/.test(readFileSync(llms, 'utf8'))) fail('/llms.txt', 'must start with a "# Title" line (llmstxt.org)');

// ---- size baseline: no page template may grow past tolerance without a deliberate baseline update ----
const BASELINE_FILE = 'scripts/size-baseline.json';
const TOLERANCE = { ratio: 0.1, bytes: 1536 }; // allow +10% or +1.5 KB, whichever is larger
const current = Object.fromEntries([...measurements].sort(([a], [b]) => a.localeCompare(b)).map(([template, m]) => [template, { js: m.js, css: m.css, html: m.html }]));
if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE_FILE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Baseline written to ${BASELINE_FILE} (${Object.keys(current).length} page templates).`);
} else if (!existsSync(BASELINE_FILE)) {
  fail(BASELINE_FILE, 'missing. Run `node scripts/check-site-quality.mjs --update-baseline` after a clean build and commit it');
} else {
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
  for (const [template, now] of Object.entries(current)) {
    const base = baseline[template];
    if (!base) {
      fail(template, 'new page template with no size baseline. Run with --update-baseline and commit the result');
      continue;
    }
    for (const kind of ['js', 'css', 'html']) {
      const allowed = base[kind] + Math.max(base[kind] * TOLERANCE.ratio, TOLERANCE.bytes);
      if (now[kind] > allowed) fail(template, `${kind.toUpperCase()} grew from ${kb(base[kind])} to ${kb(now[kind])} (baseline +${Math.round(TOLERANCE.ratio * 100)}% / ${kb(TOLERANCE.bytes)} allowed). Justify it in the PR, then --update-baseline`);
    }
  }
}

console.table(summary);
if (warnings.length) console.warn(`\n${warnings.length} warning(s):\n${warnings.map((warning) => `  ! ${warning}`).join('\n')}`);
if (errors.length) {
  console.error(`\n${errors.length} site-quality problem(s) (rules: seo.mdc, performance.mdc):\n${errors.map((error) => `  ✗ ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Site quality OK: ${pages.length} pages checked.`);
