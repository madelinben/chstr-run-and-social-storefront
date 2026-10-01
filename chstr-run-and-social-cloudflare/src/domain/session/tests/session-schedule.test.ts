import { describe, expect, it } from 'vitest';
import { nextSessionStart } from '@/domain/session/session-schedule';

describe('nextSessionStart', () => {
  it('is later the same Monday before 18:30 (BST)', () => {
    expect(nextSessionStart(new Date('2026-10-05T16:00:00Z'))).toBe('2026-10-05T18:30:00+01:00');
  });

  it('rolls to next Monday once 18:30 London has passed, and at exactly 18:30', () => {
    expect(nextSessionStart(new Date('2026-10-05T18:00:00Z'))).toBe('2026-10-12T18:30:00+01:00');
    expect(nextSessionStart(new Date('2026-10-05T17:30:00Z'))).toBe('2026-10-12T18:30:00+01:00');
  });

  it('uses GMT in winter', () => {
    expect(nextSessionStart(new Date('2026-11-02T10:00:00Z'))).toBe('2026-11-02T18:30:00+00:00');
  });

  it('crosses the clocks-going-back weekend (25 Oct 2026) with the right offset', () => {
    expect(nextSessionStart(new Date('2026-10-22T12:00:00Z'))).toBe('2026-10-26T18:30:00+00:00');
  });

  it('crosses clocks-going-forward (29 Mar 2026) with the right offset', () => {
    expect(nextSessionStart(new Date('2026-03-26T12:00:00Z'))).toBe('2026-03-30T18:30:00+01:00');
  });

  it('crosses a month and year boundary', () => {
    expect(nextSessionStart(new Date('2026-12-29T12:00:00Z'))).toBe('2027-01-04T18:30:00+00:00');
  });
});
