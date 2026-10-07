import { siteContent } from '@/data/Content/site-content';
import type { Tone } from '@/data/Content/schemas';

export interface Leader {
  /** First name, as the club uses it. */
  name: string;
  /** What to go to them for. */
  role: string;
  /** One friendly line for new members. Keep it to what is true; no invented backstories. */
  welcome: string;
  /** Strava-style flourish shown on the card. */
  kudos: string;
  /** Tailwind background token for the avatar circle. */
  tone: 'bg-accent' | 'bg-secondary' | 'bg-card';
}

export interface Legend {
  name: string;
  /** Why they earned it. */
  reason: string;
}

const toneClass: Record<Tone, Leader['tone']> = { lime: 'bg-accent', pale: 'bg-secondary', white: 'bg-card' };

/** The people new members should look for, from `src/content/site/members.json`. */
export const leaders: readonly Leader[] = siteContent.members.leaders.map((leader) => ({ ...leader, tone: toneClass[leader.tone] }));

/** Local Legends: the people who make the club what it is. The page shows an invitation while this is empty. */
export const legends: readonly Legend[] = siteContent.members.legends;

/** Strava vocabulary, translated to club life. Playful copy, not facts. */
export const stravaGlossary = siteContent.members.glossary;
