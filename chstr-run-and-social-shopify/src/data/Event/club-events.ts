import { siteContent } from '@/data/Content/site-content';
import type { TileId } from '@/data/Gallery/gallery-tiles';
import { toNonEmpty, type NonEmpty } from '@/utilities/non-empty';

export interface ClubEvent {
  /** URL slug: lowercase, hyphenated, never `past` (that is the archive page). */
  slug: string;
  title: string;
  /** Calendar date, `YYYY-MM-DD`. Whether it is past or coming up is worked out at build time. */
  date: string;
  /** One or two sentences, only what the club has told us. */
  summary: string;
  highlights: readonly string[];
  /** Another club or group involved. */
  partner?: string;
  /** Venue as a place name, when known. */
  where?: string;
  /** Pictures for the event's own gallery. */
  gallery: NonEmpty<TileId>;
}

/** Special events beyond the weekly sessions, from `src/content/site/events.json`. Add them in the admin; the archive, event pages, sitemap and home teaser follow. */
export const clubEvents: readonly ClubEvent[] = siteContent.events.map((event) => {
  const gallery = toNonEmpty(event.gallery);
  if (!gallery) throw new Error(`Event "${event.title}" needs at least one picture.`);
  return { slug: event.slug, title: event.title, date: event.date, summary: event.summary, highlights: event.highlights, gallery, ...(event.partner && { partner: event.partner }), ...(event.where && { where: event.where }) };
});
