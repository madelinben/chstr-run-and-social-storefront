/** The one source for when and where the weekly session happens. Copy, schema.org and tests all read this. */
export const SESSION_SCHEDULE = {
  dayName: 'Monday',
  weekday: 1,
  startHour: 18,
  startMinute: 30,
  timeZone: 'Europe/London',
  venueName: 'The Architect',
  locality: 'Chester',
  countryCode: 'GB',
} as const;

const pad = (value: number) => String(value).padStart(2, '0');

function londonParts(instant: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: SESSION_SCHEDULE.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), weekday };
}

function londonOffset(instant: Date): string {
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: SESSION_SCHEDULE.timeZone, timeZoneName: 'longOffset' }).formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  return zone === 'GMT' ? '+00:00' : zone.replace('GMT', '');
}

/** ISO 8601 start of the next session (Europe/London, with the correct GMT/BST offset), strictly after `now`. */
export function nextSessionStart(now: Date): string {
  const { startHour, startMinute, weekday } = SESSION_SCHEDULE;
  const local = londonParts(now);
  let daysAhead = (weekday - local.weekday + 7) % 7;
  if (daysAhead === 0 && (local.hour > startHour || (local.hour === startHour && local.minute >= startMinute))) daysAhead = 7;
  const target = new Date(Date.UTC(local.year, local.month - 1, local.day + daysAhead, startHour, startMinute));
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(target.getUTCDate())}T${pad(startHour)}:${pad(startMinute)}:00${londonOffset(target)}`;
}
