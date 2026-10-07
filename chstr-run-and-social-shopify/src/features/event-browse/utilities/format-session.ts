import { TIME_ZONE } from '@/domain/session/session-schedule';

const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** "Mon 12 Oct" for an ISO start time, in London time. */
export function formatSessionDay(iso: string): string {
  return formatter.format(new Date(iso)).replace(',', '');
}

/** "18:30" for an ISO start time, in London time. */
export function formatSessionTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}
