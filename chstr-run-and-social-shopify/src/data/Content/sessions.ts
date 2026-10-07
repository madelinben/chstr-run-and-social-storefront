import { siteContent } from '@/data/Content/site-content';
import { DAY_NAMES, SESSION_IDS, type SessionContent } from '@/data/Content/schemas';
import type { Session } from '@/domain/session/session-schedule';

function toSession(id: Session['id'], content: SessionContent): Session {
  const [hour = '0', minute = '0'] = content.startTime.split(':');
  // Sunday is 0, so Monday (index 0 in DAY_NAMES) is 1.
  const weekday = (DAY_NAMES.indexOf(content.dayName) + 1) % 7;
  return {
    id,
    name: content.name,
    dayName: content.dayName,
    weekday,
    startHour: Number(hour),
    startMinute: Number(minute),
    ...(content.durationMinutes > 0 && { durationMinutes: content.durationMinutes }),
    venueName: content.venueName,
    ...(content.streetAddress && { streetAddress: content.streetAddress }),
    ...(content.postalCode && { postalCode: content.postalCode }),
    locality: content.locality,
    countryCode: 'GB',
    ...(content.bookingUrl && { bookingUrl: content.bookingUrl }),
  };
}

/** The one source for when and where CHSTR sessions happen, built from `src/content/site/sessions.json`. */
export const SESSIONS = {
  run: toSession('run', siteContent.sessions.run),
  football: toSession('football', siteContent.sessions.football),
  netball: toSession('netball', siteContent.sessions.netball),
} as const satisfies Record<(typeof SESSION_IDS)[number], Session>;

export type SessionId = keyof typeof SESSIONS;
