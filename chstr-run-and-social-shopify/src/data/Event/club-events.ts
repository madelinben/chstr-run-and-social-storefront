import type { TileId } from '@/data/Gallery/gallery-tiles';
import type { NonEmpty } from '@/utilities/non-empty';

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
  /** Pictures for the event's own gallery. Illustrations until real photos are added (see theme.mdc). */
  gallery: NonEmpty<TileId>;
}

/** Special events beyond the weekly sessions. Add new ones here; the archive, event pages, sitemap and home teaser follow. */
export const clubEvents: readonly ClubEvent[] = [
  {
    slug: 'chester-marathon-sign-making',
    title: 'Chester Marathon Sign Making',
    date: '2026-10-05',
    summary: 'Popcorn, sign making for the Chester Marathon and bead making, with Life in Chester.',
    highlights: ['Popcorn for everyone', 'Sign making with Life in Chester, for the Chester Marathon', 'Bead making with Life in Chester'],
    partner: 'Life in Chester',
    gallery: ['speechBubbles', 'finishMedal', 'smileyCrowd', 'bubbleCluster'],
  },
  {
    slug: 'big-run-fyp-gym-saltney',
    title: 'The Big Run at FYP Gym Saltney',
    date: '2026-09-05',
    summary: 'The Big Run at FYP Gym in Saltney, with Steazy Wrexham Run Club.',
    highlights: ['A run with Steazy Wrexham Run Club', 'At FYP Gym, Saltney'],
    partner: 'Steazy Wrexham Run Club',
    where: 'FYP Gym, Saltney',
    gallery: ['friendsRunning', 'hillSunset', 'finishMedal', 'smileyCrowd'],
  },
  {
    slug: '10k-run-wrexham-run-club',
    title: '10k Run With Wrexham Run Club',
    date: '2026-06-14',
    summary: 'A 10k run with Wrexham Run Club at The Architect in Chester.',
    highlights: ['A 10k run', 'Together with Wrexham Run Club', 'At The Architect, Chester'],
    partner: 'Wrexham Run Club',
    where: 'The Architect, Chester',
    gallery: ['chesterRoute', 'sprintSunrise', 'stopwatch', 'friendsRunning'],
  },
  {
    slug: 'long-run',
    title: 'Long Run',
    date: '2026-10-18',
    summary: 'A long run on Sunday 18 October.',
    highlights: ['Follow us on Instagram or in the WhatsApp group for the start time and route'],
    gallery: ['nightRun', 'chesterRoute', 'hillSunset', 'stopwatch'],
  },
];
