import { describe, expect, it } from 'vitest';
import { SESSIONS } from '@/data/Content/sessions';
import { buildIcs, escapeText, googleCalendarUrl, localBasic } from '@/features/event-browse/utilities/calendar';

const now = new Date('2026-10-07T12:00:00Z');
const runEntry = { session: SESSIONS.run, description: 'A free run, then a social.', url: 'https://x.test/events/' };
const footballEntry = { session: SESSIONS.football, description: 'Football, Thursdays.', url: 'https://x.test/events/' };
const entries = [runEntry, footballEntry];

describe('localBasic', () => {
  it('keeps the wall-clock time and drops the offset', () => {
    expect(localBasic('2026-10-12T18:30:00+01:00')).toBe('20261012T183000');
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(now, entries, 'x.test');

  it('is a valid-looking VCALENDAR with CRLF endings and a London timezone', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('TZID:Europe/London');
    expect(ics.replaceAll('\r\n', '').includes('\n')).toBe(false);
  });

  it('has one weekly event per session on the right day and time', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;TZID=Europe/London:20261012T183000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO');
    expect(ics).toContain('DTSTART;TZID=Europe/London:20261008T200000');
    expect(ics).toContain('DTEND;TZID=Europe/London:20261008T210000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH');
  });

  it('gives the open-ended run a default one-hour end and escapes commas in the location', () => {
    expect(ics).toContain('DTEND;TZID=Europe/London:20261012T193000');
    // Long lines are folded per RFC 5545; unfold (CRLF + space) before matching.
    expect(ics.replaceAll('\r\n ', '')).toContain('LOCATION:Chester University Football Pitches\\, Parkgate Rd\\, Chester\\, CH1 4BJ');
  });

  it('never leaves a line over 75 characters', () => {
    expect(ics.split('\r\n').every((line) => line.length <= 75)).toBe(true);
  });
});

describe('googleCalendarUrl', () => {
  it('builds a weekly TEMPLATE link with the London timezone', () => {
    const url = new URL(googleCalendarUrl(now, footballEntry));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('dates')).toBe('20261008T200000/20261008T210000');
    expect(url.searchParams.get('ctz')).toBe('Europe/London');
    expect(url.searchParams.get('recur')).toBe('RRULE:FREQ=WEEKLY;BYDAY=TH');
    expect(url.searchParams.get('location')).toContain('CH1 4BJ');
  });
});

describe('escapeText', () => {
  const bs = String.fromCharCode(92);

  it('puts a backslash before semicolons and commas, doubles backslashes, and turns newlines into \\n', () => {
    expect(escapeText('a;b')).toBe(`a${bs};b`);
    expect(escapeText('a,b')).toBe(`a${bs},b`);
    expect(escapeText(`a${bs}b`)).toBe(`a${bs}${bs}b`);
    expect(escapeText('a\nb')).toBe(`a${bs}nb`);
  });

  it('leaves plain text alone', () => {
    expect(escapeText('Chester CH1 4BJ')).toBe('Chester CH1 4BJ');
  });
});
