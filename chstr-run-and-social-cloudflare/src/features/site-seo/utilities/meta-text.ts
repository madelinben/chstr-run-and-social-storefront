import { SITE_NAME } from '@/features/site-seo/utilities/schema-nodes';

const TITLE_MAX = 60;
const DESCRIPTION_MIN = 90;
const DESCRIPTION_MAX = 160;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** `Page – Brand`; drops the brand for long names, then truncates, so content staff cannot break the 60-char limit. */
export function buildTitle(title: string, absoluteTitle?: string): string {
  if (absoluteTitle) return truncate(absoluteTitle, TITLE_MAX);
  const withBrand = `${title} – ${SITE_NAME}`;
  return withBrand.length <= TITLE_MAX ? withBrand : truncate(title, TITLE_MAX);
}

const PRODUCT_TAIL = 'Pay online and collect it at a Monday CHSTR run in Chester. No delivery.';

/** Product meta description from what staff entered: always 90-160 chars, always ends on the pickup facts when there is room. */
export function productMetaDescription(name: string, price: string, description: string): string {
  const base = `${name}, ${price}. ${description.replace(/\s+/g, ' ').trim()}`.trim();
  const full = base.length >= DESCRIPTION_MIN ? base : `${base} ${PRODUCT_TAIL}`;
  return truncate(full, DESCRIPTION_MAX);
}
