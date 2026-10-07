import { TIME_ZONE } from '@/utilities/time-zone';

export interface Session {
  id: 'run' | 'football' | 'netball';
  /** Public name, e.g. "Monday run and social". */
  name: string;
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  startHour: number;
  startMinute: number;
  /** Omit when the end is not fixed (the Monday run flows into the social). */
  durationMinutes?: number;
  venueName: string;
  streetAddress?: string;
  postalCode?: string;
  locality: string;
  countryCode: 'GB';
  /** Where to book, when the session is booked online. */
  bookingUrl?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

function londonParts(instant: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday ?? '');
  if (weekday < 0) throw new Error('Could not read the weekday from the London date parts.');
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), weekday };
}

function londonOffset(instant: Date): string {
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' }).formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  return zone === 'GMT' ? '+00:00' : zone.replace('GMT', '');
}

/** Any instant as ISO 8601 in Europe/London with the right GMT/BST offset. */
export function toLondonIso(instant: Date): string {
  const local = londonParts(instant);
  return `${local.year}-${pad(local.month)}-${pad(local.day)}T${pad(local.hour)}:${pad(local.minute)}:00${londonOffset(instant)}`;
}

/** ISO 8601 start of the next occurrence of `session` (Europe/London, correct offset), strictly after `now`. */
export function nextSessionStart(now: Date, session: Session): string {
  const local = londonParts(now);
  let daysAhead = (session.weekday - local.weekday + 7) % 7;
  if (daysAhead === 0 && (local.hour > session.startHour || (local.hour === session.startHour && local.minute >= session.startMinute))) daysAhead = 7;
  const target = new Date(Date.UTC(local.year, local.month - 1, local.day + daysAhead, session.startHour, session.startMinute));
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(target.getUTCDate())}T${pad(session.startHour)}:${pad(session.startMinute)}:00${londonOffset(target)}`;
}

/** The next `count` start times, one per week, each strictly after the previous. */
export function upcomingStarts(now: Date, session: Session, count: number): string[] {
  const starts: string[] = [];
  let cursor = now;
  for (let index = 0; index < count; index += 1) {
    const start = nextSessionStart(cursor, session);
    starts.push(start);
    cursor = new Date(new Date(start).getTime() + 60_000);
  }
  return starts;
}

/** End time for a start, or undefined when the session has no fixed length. */
export function sessionEnd(start: string, session: Session): string | undefined {
  return session.durationMinutes === undefined ? undefined : toLondonIso(new Date(new Date(start).getTime() + session.durationMinutes * 60_000));
}
