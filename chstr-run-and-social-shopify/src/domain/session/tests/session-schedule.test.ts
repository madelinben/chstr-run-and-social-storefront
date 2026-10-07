import { describe, expect, it } from 'vitest';
import { nextSessionStart, SESSIONS, sessionEnd, upcomingStarts } from '@/domain/session/session-schedule';

describe('nextSessionStart', () => {
  it('is later the same Monday before 18:30 (BST)', () => {
    expect(nextSessionStart(new Date('2026-10-05T16:00:00Z'), SESSIONS.run)).toBe('2026-10-05T18:30:00+01:00');
  });

  it('rolls to next Monday once 18:30 London has passed, and at exactly 18:30', () => {
    expect(nextSessionStart(new Date('2026-10-05T18:00:00Z'), SESSIONS.run)).toBe('2026-10-12T18:30:00+01:00');
    expect(nextSessionStart(new Date('2026-10-05T17:30:00Z'), SESSIONS.run)).toBe('2026-10-12T18:30:00+01:00');
  });

  it('uses GMT in winter', () => {
    expect(nextSessionStart(new Date('2026-11-02T10:00:00Z'), SESSIONS.run)).toBe('2026-11-02T18:30:00+00:00');
  });

  it('crosses the clocks-going-back weekend (25 Oct 2026) with the right offset', () => {
    expect(nextSessionStart(new Date('2026-10-22T12:00:00Z'), SESSIONS.run)).toBe('2026-10-26T18:30:00+00:00');
  });

  it('crosses clocks-going-forward (29 Mar 2026) with the right offset', () => {
    expect(nextSessionStart(new Date('2026-03-26T12:00:00Z'), SESSIONS.run)).toBe('2026-03-30T18:30:00+01:00');
  });

  it('crosses a month and year boundary', () => {
    expect(nextSessionStart(new Date('2026-12-29T12:00:00Z'), SESSIONS.run)).toBe('2027-01-04T18:30:00+00:00');
  });
});

describe('football (Thursday 20:00-21:00)', () => {
  it('finds the next Thursday and rolls over once it has started', () => {
    expect(nextSessionStart(new Date('2026-10-07T10:00:00Z'), SESSIONS.football)).toBe('2026-10-08T20:00:00+01:00');
    expect(nextSessionStart(new Date('2026-10-08T19:30:00Z'), SESSIONS.football)).toBe('2026-10-15T20:00:00+01:00');
  });

  it('ends an hour after it starts, across a clock change', () => {
    expect(sessionEnd('2026-10-22T20:00:00+01:00', SESSIONS.football)).toBe('2026-10-22T21:00:00+01:00');
    expect(sessionEnd('2026-10-29T20:00:00+00:00', SESSIONS.football)).toBe('2026-10-29T21:00:00+00:00');
  });

  it('has no end for the open-ended Monday run', () => {
    expect(sessionEnd('2026-10-12T18:30:00+01:00', SESSIONS.run)).toBeUndefined();
  });
});

describe('upcomingStarts', () => {
  it('lists consecutive weekly starts and the offset flips when the clocks go back', () => {
    expect(upcomingStarts(new Date('2026-10-20T12:00:00Z'), SESSIONS.run, 3)).toEqual(['2026-10-26T18:30:00+00:00', '2026-11-02T18:30:00+00:00', '2026-11-09T18:30:00+00:00']);
    expect(upcomingStarts(new Date('2026-10-19T12:00:00Z'), SESSIONS.run, 2)).toEqual(['2026-10-19T18:30:00+01:00', '2026-10-26T18:30:00+00:00']);
  });
});
