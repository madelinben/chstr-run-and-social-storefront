import { describe, expect, it } from 'vitest';
import { formatSessionDay, formatSessionTime } from '@/features/event-browse/utilities/format-session';

describe('session formatting (London time)', () => {
  it('formats a BST start', () => {
    expect(formatSessionDay('2026-10-12T18:30:00+01:00')).toBe('Mon 12 Oct');
    expect(formatSessionTime('2026-10-12T18:30:00+01:00')).toBe('18:30');
  });

  it('formats a GMT start and keeps the local wall-clock time', () => {
    expect(formatSessionDay('2026-11-05T20:00:00+00:00')).toBe('Thu 5 Nov');
    expect(formatSessionTime('2026-11-05T20:00:00+00:00')).toBe('20:00');
  });
});
