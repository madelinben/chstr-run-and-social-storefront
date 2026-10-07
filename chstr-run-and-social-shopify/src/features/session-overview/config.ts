import { SESSIONS } from '@/data/Content/sessions';
import { siteContent } from '@/data/Content/site-content';
import type { Tone } from '@/data/Content/schemas';

const hhmm = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export const sessionFacts = [
  { label: 'When', value: `${SESSIONS.run.dayName}s, ${hhmm(SESSIONS.run.startHour, SESSIONS.run.startMinute)}` },
  { label: 'Where', value: `${SESSIONS.run.venueName}, ${SESSIONS.run.locality}` },
  { label: 'Cost', value: 'Always Free' },
] as const;

/** Netball is booked online through the Back to Netball programme at the club's venue. */
export const NETBALL = {
  programme: 'Back to Netball',
  session: SESSIONS.netball,
} as const;

/** Card colours the design uses, by the plain names the admin offers. */
export const toneClass: Record<Tone, string> = { lime: 'bg-accent', pale: 'bg-secondary', white: 'bg-card' };

export const activities = siteContent.home.activities.map((activity) => ({ ...activity, tile: activity.picture, color: toneClass[activity.tone] }));

export const mondaySteps = siteContent.home.mondaySteps.map((step) => ({ ...step, tile: step.picture }));
