import { nextSessionStart, sessionEnd, TIME_ZONE, toLondonIso, type Session } from '@/domain/session/session-schedule';

/** Calendar apps need an end. Sessions with no fixed length (the Monday run) get this. */
export const DEFAULT_CALENDAR_MINUTES = 60;

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** `2026-10-12T18:30:00+01:00` -> `20261012T183000` (local wall-clock time, paired with a TZID). */
export function localBasic(iso: string): string {
  return iso.slice(0, 19).replaceAll('-', '').replaceAll(':', '');
}

const utcBasic = (date: Date) => `${date.toISOString().slice(0, 19).replaceAll('-', '').replaceAll(':', '')}Z`;

function endFor(start: string, session: Session): string {
  return sessionEnd(start, session) ?? toLondonIso(new Date(new Date(start).getTime() + DEFAULT_CALENDAR_MINUTES * 60_000));
}

export function locationText(session: Session): string {
  return [session.venueName, session.streetAddress, session.locality, session.postalCode].filter(Boolean).join(', ');
}

const BACKSLASH = String.fromCharCode(92);

/** RFC 5545 text escaping: backslash, semicolon, comma and newline each get a leading backslash. */
export function escapeText(text: string): string {
  return [...text].map((char) => (char === BACKSLASH || char === ';' || char === ',' ? BACKSLASH + char : char === '\n' ? `${BACKSLASH}n` : char)).join('');
}

/** RFC 5545 line folding: lines over 75 characters continue on a new line starting with a space. */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

const LONDON_TIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIME_ZONE}`,
  'BEGIN:STANDARD',
  'DTSTART:19701025T020000',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700329T010000',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
];

export interface CalendarEntry {
  session: Session;
  description: string;
  url: string;
}

/** A subscribable iCalendar feed: one weekly-recurring event per session, anchored on its next occurrence. */
export function buildIcs(now: Date, entries: CalendarEntry[], host: string): string {
  const events = entries.flatMap(({ session, description, url }) => {
    const start = nextSessionStart(now, session);
    return [
      'BEGIN:VEVENT',
      `UID:chstr-${session.id}@${host}`,
      `DTSTAMP:${utcBasic(now)}`,
      `DTSTART;TZID=${TIME_ZONE}:${localBasic(start)}`,
      `DTEND;TZID=${TIME_ZONE}:${localBasic(endFor(start, session))}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DAY_CODES[session.weekday]}`,
      `SUMMARY:${escapeText(`CHSTR Run & Social: ${session.name}`)}`,
      `LOCATION:${escapeText(locationText(session))}`,
      `DESCRIPTION:${escapeText(description)}`,
      `URL:${url}`,
      'END:VEVENT',
    ];
  });
  return `${['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CHSTR Run & Social//Sessions//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:CHSTR Run & Social`, `X-WR-TIMEZONE:${TIME_ZONE}`, ...LONDON_TIMEZONE, ...events, 'END:VCALENDAR'].map(fold).join('\r\n')}\r\n`;
}

/** "Add to Google Calendar" link for the weekly series, starting at the next occurrence. */
export function googleCalendarUrl(now: Date, { session, description }: CalendarEntry): string {
  const start = nextSessionStart(now, session);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `CHSTR Run & Social: ${session.name}`,
    dates: `${localBasic(start)}/${localBasic(endFor(start, session))}`,
    ctz: TIME_ZONE,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${DAY_CODES[session.weekday]}`,
    location: locationText(session),
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
