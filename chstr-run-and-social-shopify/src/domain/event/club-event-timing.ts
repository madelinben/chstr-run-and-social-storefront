import { TIME_ZONE } from '@/utilities/time-zone';

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const longFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** Today's calendar date in Europe/London as `YYYY-MM-DD`. */
export function londonToday(now: Date): string {
  return dayFormatter.format(now);
}

const asUtcNoon = (date: string) => new Date(`${date}T12:00:00Z`);

/** "Monday 5 October 2026". The input is a plain calendar date, so no timezone shifting can move it a day. */
export function formatEventDate(date: string): string {
  return longFormatter.format(asUtcNoon(date)).replace(',', '');
}

/** "Mon 5 Oct 2026". */
export function formatEventDateShort(date: string): string {
  return shortFormatter.format(asUtcNoon(date)).replace(',', '');
}

/**
 * Splits dated club events at today (London). An event dated today is still upcoming.
 * Upcoming run soonest first; past run most recent first.
 */
export function splitEvents<Event extends { date: string }>(events: readonly Event[], now: Date): { upcoming: Event[]; past: Event[] } {
  const today = londonToday(now);
  const upcoming = events.filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((event) => event.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}
