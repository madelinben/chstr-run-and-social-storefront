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

/** `srcset` value over the given widths; square crop when `square` is set. Empty for non-Shopify URLs. */
export function shopifySrcSet(url: string, widths: readonly number[], square = false): string {
  if (!url.startsWith(SHOPIFY_CDN)) return '';
  return widths.map((width) => `${shopifyImageUrl(url, width, square ? width : undefined)} ${width}w`).join(', ');
}
