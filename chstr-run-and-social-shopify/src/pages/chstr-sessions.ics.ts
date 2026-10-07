import { requireSite } from '@/utilities/require-site';
import type { APIRoute } from 'astro';
import { SESSIONS } from '@/domain/session/session-schedule';
import { sessionCopy } from '@/features/event-browse/config';
import { buildIcs } from '@/features/event-browse/utilities/calendar';
import { toAbsolute } from '@/utilities/with-base';

/** Subscribable calendar feed of the weekly sessions. Regenerated on every build (weekly), so the anchor dates stay current. */
export const GET: APIRoute = ({ site }) => {
  const url = toAbsolute(requireSite(site), '/events/');
  const body = buildIcs(
    new Date(),
    [SESSIONS.run, SESSIONS.football, SESSIONS.netball].map((session) => ({ session, url, description: sessionCopy[session.id].calendar })),
    requireSite(site).host,
  );
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
