import { SITE_MOTTO, SITE_NAME } from '@/utilities/brand';
import { nextSessionStart, SESSIONS, sessionEnd, TIME_ZONE, type Session } from '@/domain/session/session-schedule';

export interface JsonLdNode {
  '@type': string | string[];
  '@id'?: string;
  [property: string]: unknown;
}

export interface Crumb {
  name: string;
  path: string;
}


/** `origin` is the site root URL INCLUDING any base path (see `siteRoot`), so paths resolve under it. */
const at = (origin: string, path: string) => new URL(path.replace(/^\//, ''), origin.endsWith('/') ? origin : `${origin}/`).href;
export const organizationId = (origin: string) => at(origin, '/#organization');
export const websiteId = (origin: string) => at(origin, '/#website');

export function organizationNode(input: { origin: string; sameAs: string[]; email?: string; whatsapp?: string }): JsonLdNode {
  const contactPoints = [
    input.email && { '@type': 'ContactPoint', contactType: 'customer support', email: input.email, availableLanguage: 'en' },
    input.whatsapp && { '@type': 'ContactPoint', contactType: 'customer support', url: `https://wa.me/${input.whatsapp.replace(/\D/g, '')}`, availableLanguage: 'en' },
  ].filter(Boolean);
  return {
    '@type': ['Organization', 'SportsClub'],
    '@id': organizationId(input.origin),
    name: SITE_NAME,
    alternateName: 'CHSTR',
    slogan: SITE_MOTTO,
    url: at(input.origin, '/'),
    logo: { '@type': 'ImageObject', url: at(input.origin, '/apple-touch-icon.png'), width: 180, height: 180 },
    description: 'A free, friendly run and social club in Chester: running, football, netball and social nights.',
    address: { '@type': 'PostalAddress', addressLocality: SESSIONS.run.locality, addressCountry: SESSIONS.run.countryCode },
    areaServed: SESSIONS.run.locality,
    ...(input.sameAs.length > 0 && { sameAs: input.sameAs }),
    ...(contactPoints.length > 0 && { contactPoint: contactPoints }),
  };
}

export function websiteNode(origin: string): JsonLdNode {
  return { '@type': 'WebSite', '@id': websiteId(origin), url: at(origin, '/'), name: SITE_NAME, inLanguage: 'en-GB', publisher: { '@id': organizationId(origin) } };
}

export function webPageNode(input: { origin: string; url: string; name: string; description: string; type?: string; image?: string; hasBreadcrumb: boolean }): JsonLdNode {
  return {
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': websiteId(input.origin) },
    about: { '@id': organizationId(input.origin) },
    ...(input.image && { primaryImageOfPage: { '@type': 'ImageObject', url: input.image } }),
    ...(input.hasBreadcrumb && { breadcrumb: { '@id': `${input.url}#breadcrumb` } }),
  };
}

export function breadcrumbNode(origin: string, url: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: at(origin, crumb.path) })),
  };
}

export function faqPageNode(url: string, items: { question: string; answer: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

const hhmm = (session: Session) => `${String(session.startHour).padStart(2, '0')}:${String(session.startMinute).padStart(2, '0')}:00`;

/**
 * A recurring weekly session as a schema.org Event. `startDate` is the next occurrence at build time, so the site is rebuilt at least weekly.
 * Only claim `free` when it is known to be free (the Monday run is; do not assume it for other sessions).
 */
export function sessionEventNode(input: { origin: string; now: Date; image: string; session: Session; id: string; description: string; url: string; free: boolean }): JsonLdNode {
  const { session } = input;
  const startDate = nextSessionStart(input.now, session);
  const endDate = sessionEnd(startDate, session);
  return {
    '@type': 'Event',
    '@id': input.id,
    name: `${SITE_NAME}: ${session.name}`,
    description: input.description,
    startDate,
    ...(endDate && { endDate }),
    eventSchedule: {
      '@type': 'Schedule',
      repeatFrequency: 'P1W',
      byDay: `https://schema.org/${session.dayName}`,
      startTime: hhmm(session),
      scheduleTimezone: TIME_ZONE,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(input.free && { isAccessibleForFree: true }),
    image: [input.image],
    location: {
      '@type': 'Place',
      name: session.venueName,
      address: {
        '@type': 'PostalAddress',
        ...(session.streetAddress && { streetAddress: session.streetAddress }),
        addressLocality: session.locality,
        ...(session.postalCode && { postalCode: session.postalCode }),
        addressCountry: session.countryCode,
      },
    },
    organizer: { '@id': organizationId(input.origin) },
    ...(input.free && { offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', availability: 'https://schema.org/InStock', url: input.url, validFrom: startDate } }),
  };
}

export interface ProductOffer {
  /** Decimal string, e.g. "20.00". */
  price: string;
  inStock: boolean;
  name?: string;
}

export function productNode(input: { url: string; origin: string; name: string; description: string; images: string[]; offers: ProductOffer[]; sku?: string }): JsonLdNode {
  return {
    '@type': 'Product',
    '@id': `${input.url}#product`,
    url: input.url,
    name: input.name,
    description: input.description,
    image: input.images,
    ...(input.sku && { sku: input.sku }),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: input.offers.map((offer) => ({
      '@type': 'Offer',
      ...(offer.name && { name: offer.name }),
      url: input.url,
      price: offer.price,
      priceCurrency: 'GBP',
      availability: offer.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': organizationId(input.origin) },
    })),
  };
}

export function itemListNode(url: string, items: { url: string; name: string; image: string }[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    '@id': `${url}#items`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, url: item.url, name: item.name, image: item.image })),
  };
}
