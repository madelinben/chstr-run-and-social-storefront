import { describe, expect, it } from 'vitest';
import { SESSIONS } from '@/data/Content/sessions';
import { breadcrumbNode, faqPageNode, organizationNode, productNode, sessionEventNode } from '@/features/site-seo/utilities/schema-nodes';

const origin = 'https://www.example.test';

describe('schema nodes', () => {
  it('Organization omits empty sameAs and contactPoint', () => {
    const node = organizationNode({ origin, sameAs: [] });
    expect(node).not.toHaveProperty('sameAs');
    expect(node).not.toHaveProperty('contactPoint');
    expect(node['@id']).toBe('https://www.example.test/#organization');
  });

  it('Organization builds a wa.me link from a formatted number', () => {
    const node = organizationNode({ origin, sameAs: ['https://x.test'], whatsapp: '+44 7700 900123' });
    expect(JSON.stringify(node)).toContain('https://wa.me/447700900123');
  });

  it('run Event is free, weekly, Monday, and starts on the schedule', () => {
    const node = sessionEventNode({ origin, now: new Date('2026-10-01T12:00:00Z'), image: `${origin}/og-default.png`, session: SESSIONS.run, id: `${origin}/#run`, description: 'd', url: `${origin}/`, free: true });
    expect(node.startDate).toBe('2026-10-05T18:30:00+01:00');
    expect(node.isAccessibleForFree).toBe(true);
    expect(node).not.toHaveProperty('endDate');
    expect(node.eventSchedule).toMatchObject({ repeatFrequency: 'P1W', byDay: 'https://schema.org/Monday' });
  });

  it('football Event has the venue address and an end, and never claims to be free', () => {
    const node = sessionEventNode({ origin, now: new Date('2026-10-01T12:00:00Z'), image: `${origin}/og-default.png`, session: SESSIONS.football, id: `${origin}/#football`, description: 'd', url: `${origin}/events/`, free: false });
    expect(node.startDate).toBe('2026-10-01T20:00:00+01:00');
    expect(node.endDate).toBe('2026-10-01T21:00:00+01:00');
    expect(node).not.toHaveProperty('isAccessibleForFree');
    expect(node).not.toHaveProperty('offers');
    expect(JSON.stringify(node.location)).toContain('CH1 4BJ');
  });

  it('Product offers carry real availability, GBP and the price shown', () => {
    const node = productNode({ origin, url: `${origin}/merchandise/tee/`, name: 'Tee', description: 'd', images: ['https://i.test/a.png'], offers: [{ price: '20.00', inStock: true }, { price: '20.00', inStock: false, name: 'L' }] });
    const offers = node.offers as { priceCurrency: string; availability: string }[];
    expect(offers.map((offer) => offer.availability)).toEqual(['https://schema.org/InStock', 'https://schema.org/OutOfStock']);
    expect(offers.every((offer) => offer.priceCurrency === 'GBP')).toBe(true);
  });

  it('Breadcrumb positions start at 1 with absolute URLs', () => {
    const node = breadcrumbNode(origin, `${origin}/faqs/`, [{ name: 'Home', path: '/' }, { name: 'FAQs', path: '/faqs/' }]);
    expect(node.itemListElement).toMatchObject([{ position: 1, item: 'https://www.example.test/' }, { position: 2, item: 'https://www.example.test/faqs/' }]);
  });

  it('FAQPage maps every question', () => {
    expect(faqPageNode(`${origin}/faqs/`, [{ question: 'Q?', answer: 'A.' }]).mainEntity).toHaveLength(1);
  });
});
