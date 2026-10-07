import type { SessionId } from '@/domain/session/session-schedule';
import { ROUTE_NOTE } from '@/utilities/brand';

/** Public copy for each weekly session, shared by the events page, the calendar feed and the schema. */
export const sessionCopy = {
  run: {
    title: 'Run And Social',
    blurb: 'Meet at The Architect for a run at your own pace, then stay for the social. Free, always.',
    calendar: `A free Monday run followed by a social at The Architect, Chester. All people, all paces, all welcome. ${ROUTE_NOTE} Bring a light on dark nights.`,
  },
  football: {
    title: 'Football',
    blurb: 'Come and play. All people, all paces, all welcome on the pitch too.',
    calendar: 'Thursday football at Chester University Football Pitches, Parkgate Rd, Chester CH1 4BJ. All people, all paces, all welcome.',
  },
  netball: {
    title: 'Netball',
    blurb: 'Booked online through Back to Netball. All people, all paces, all welcome.',
    calendar: 'Tuesday netball at The Cheshire County Sports Club, Plas Newton Ln, Chester CH2 1PR. Book online through Back to Netball.',
  },
} as const satisfies Record<SessionId, { title: string; blurb: string; calendar: string }>;
