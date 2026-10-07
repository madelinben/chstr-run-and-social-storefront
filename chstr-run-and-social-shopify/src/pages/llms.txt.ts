import { requireSite } from '@/utilities/require-site';
import type { APIRoute } from 'astro';
import { SESSIONS } from '@/data/Content/sessions';
import { locationText } from '@/features/event-browse/utilities/calendar';
import { ROUTE_NOTE, SITE_MOTTO, socialLinks } from '@/data/Content/settings';
import { SITE_NAME } from '@/utilities/brand';
import { toAbsolute } from '@/utilities/with-base';

const hhmm = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/** llms.txt: a plain-language map of the site for AI assistants and crawlers (llmstxt.org). Built from the same data as the pages. */
export const GET: APIRoute = ({ site }) => {
  const page = (path: string) => toAbsolute(requireSite(site), path);
  const { run, football, netball } = SESSIONS;
  const socials = [
    socialLinks.instagram && `- [Instagram](${socialLinks.instagram})`,
    socialLinks.facebook && `- [Facebook](${socialLinks.facebook})`,
    socialLinks.whatsappGroup && `- [WhatsApp group](${socialLinks.whatsappGroup})`,
  ].filter(Boolean);

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_MOTTO} A free, friendly run and social club in Chester: running, football, netball and social nights.`,
    '',
    '## Key facts',
    `- Run and social: ${run.dayName}s at ${hhmm(run.startHour, run.startMinute)}, ${locationText(run)}. Always free. ${ROUTE_NOTE} New runners sign the waiver once before their first session.`,
    '- Lights: bring a light of any kind on dark nights (head torch, or a reflective running vest with lights).',
    `- Football: ${football.dayName}s ${hhmm(football.startHour, football.startMinute)} to ${hhmm(football.startHour + 1, football.startMinute)}, ${locationText(football)}.`,
    `- Netball: ${netball.dayName}s ${hhmm(netball.startHour, netball.startMinute)} to ${hhmm(netball.startHour + 1, netball.startMinute)}, ${locationText(netball)}. Book online: ${netball.bookingUrl}`,
    '- Merchandise: pay online, collect at a Monday run. No delivery, no account.',
    '',
    '## Pages',
    `- [Home](${page('/')}): what CHSTR is, when and where, how a Monday works`,
    `- [Events and calendar](${page('/events/')}): weekly sessions, upcoming dates, calendar download`,
    `- [Gallery](${page('/gallery/')}): the crew in pictures`,
    `- [Past events](${page('/events/past/')}): what the club has done, each with its own gallery`,
    `- [Members](${page('/members/')}): who to look for: Corey (social and football), Emily and Nathan (routes)`,
    `- [FAQs](${page('/faqs/')}): common questions answered`,
    `- [Waiver](${page('/waiver/')}): sign once before your first session`,
    `- [Merchandise](${page('/merchandise/')}): club clothing, collected at a run`,
    `- [Contact](${page('/contact/')}): email, WhatsApp and social links`,
    `- [Calendar feed](${page('/chstr-sessions.ics')}): iCalendar file for the weekly sessions`,
    ...(socials.length > 0 ? ['', '## Social', ...socials] : []),
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
