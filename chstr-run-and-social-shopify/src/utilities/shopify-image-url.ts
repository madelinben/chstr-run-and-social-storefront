const SHOPIFY_CDN = 'https://cdn.shopify.com/';

/** Asks Shopify's image CDN for the size we display, never the original upload. Non-Shopify URLs (local files, the dev mock) pass through. */
export function shopifyImageUrl(url: string, width: number, height?: number): string {
  if (!url.startsWith(SHOPIFY_CDN)) return url;
  const sized = new URL(url);
  sized.searchParams.set('width', String(width));
  if (height) {
    sized.searchParams.set('height', String(height));
    sized.searchParams.set('crop', 'center');
  }
  return sized.toString();
}

/** `srcset` over the given widths. With `aspect` (width / height, e.g. 1 or 4 / 3) each size is cropped to that shape. Empty for non-Shopify URLs. */
export function shopifySrcSet(url: string, widths: readonly number[], aspect?: number): string {
  if (!url.startsWith(SHOPIFY_CDN)) return '';
  return widths.map((width) => `${shopifyImageUrl(url, width, aspect ? Math.round(width / aspect) : undefined)} ${width}w`).join(', ');
}
