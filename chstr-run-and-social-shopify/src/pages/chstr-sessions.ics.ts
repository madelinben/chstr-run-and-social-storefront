import type { APIRoute } from 'astro';
import { SESSIONS } from '@/domain/session/session-schedule';
import { buildIcs } from '@/features/event-browse/utilities/calendar';
import { toAbsolute } from '@/utilities/with-base';

/** Subscribable calendar feed of the weekly sessions. Regenerated on every build (weekly), so the anchor dates stay current. */
export const GET: APIRoute = ({ site }) => {
  const url = toAbsolute(site!, '/events/');
  const body = buildIcs(
    new Date(),
    [
      { session: SESSIONS.run, url, description: 'A free Monday run followed by a social at The Architect, Chester. All people, all paces, all welcome. Bring a light on dark nights.' },
      { session: SESSIONS.football, url, description: 'Thursday football at Chester University Football Pitches. All people, all paces, all welcome.' },
    ],
    site!.host,
  );
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
