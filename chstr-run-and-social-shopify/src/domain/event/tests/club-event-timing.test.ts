import { describe, expect, it } from 'vitest';
import { formatEventDate, formatEventDateShort, londonToday, splitEvents } from '@/domain/event/club-event-timing';

describe('londonToday', () => {
  it('uses the London calendar day, not UTC', () => {
    expect(londonToday(new Date('2026-10-05T22:30:00Z'))).toBe('2026-10-05'); // 23:30 BST
    expect(londonToday(new Date('2026-06-14T23:30:00Z'))).toBe('2026-06-15'); // 00:30 BST next day
    expect(londonToday(new Date('2026-12-01T00:30:00Z'))).toBe('2026-12-01'); // GMT
  });
});

describe('formatEventDate', () => {
  it('names the weekday correctly for known club dates', () => {
    expect(formatEventDate('2026-10-05')).toBe('Monday 5 October 2026');
    expect(formatEventDate('2026-09-05')).toBe('Saturday 5 September 2026');
    expect(formatEventDate('2026-06-14')).toBe('Sunday 14 June 2026');
    expect(formatEventDateShort('2026-10-18')).toBe('Sun 18 Oct 2026');
  });
});

describe('splitEvents', () => {
  const events = [{ date: '2026-09-05', id: 'big' }, { date: '2026-10-18', id: 'long' }, { date: '2026-10-05', id: 'signs' }, { date: '2026-06-14', id: 'ten' }];

  it('puts earlier dates in past (newest first) and later dates in upcoming (soonest first)', () => {
    const { upcoming, past } = splitEvents(events, new Date('2026-10-07T12:00:00Z'));
    expect(past.map((event) => event.id)).toEqual(['signs', 'big', 'ten']);
    expect(upcoming.map((event) => event.id)).toEqual(['long']);
  });

  it('treats an event dated today as still upcoming, and moves it to past the next day', () => {
    expect(splitEvents(events, new Date('2026-10-18T09:00:00Z')).upcoming.map((event) => event.id)).toEqual(['long']);
    expect(splitEvents(events, new Date('2026-10-19T09:00:00Z')).past.map((event) => event.id)).toContain('long');
  });
});
