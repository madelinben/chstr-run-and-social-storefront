import { siteContent } from '@/data/Content/site-content';

/** Public copy for each weekly session, shared by the events page, the calendar feed and the schema. Editable in the admin under Sessions. */
export const sessionCopy = {
  run: pick(siteContent.sessions.run),
  football: pick(siteContent.sessions.football),
  netball: pick(siteContent.sessions.netball),
} as const;

function pick({ title, blurb, calendar }: { title: string; blurb: string; calendar: string }) {
  return { title, blurb, calendar };
}
