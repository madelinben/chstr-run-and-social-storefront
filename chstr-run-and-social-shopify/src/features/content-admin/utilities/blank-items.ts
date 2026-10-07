/** What a new row looks like when the editor adds one to a list, by the list's field name. */
export const BLANK_ITEMS: Readonly<Record<string, unknown>> = {
  events: { slug: '', title: '', date: '', summary: '', highlights: [''], partner: '', where: '', gallery: [] },
  leaders: { name: '', role: '', welcome: '', kudos: '', tone: 'lime' },
  legends: { name: '', reason: '' },
  glossary: { term: '', meaning: '' },
  activities: { name: '', note: '', picture: '', tone: 'lime', href: '/events/' },
  highlights: '',
  gallery: '',
  tickerTop: '',
  tickerBottom: '',
};

/** Fields that are a pick from a short list rather than free text. `picture` and `gallery` are filled with the picture library. */
export const FIXED_CHOICES: Readonly<Record<string, readonly string[]>> = {
  dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  tone: ['lime', 'pale', 'white'],
};

/** Fields shown as a taller box. */
export const LONG_TEXT = new Set(['text', 'blurb', 'calendar', 'summary', 'welcome', 'meaning', 'reason', 'note', 'routeNote', 'answer']);

/** Plain-English field help, shown under the label. */
export const FIELD_HELP: Readonly<Record<string, string>> = {
  whatsappGroupUrl: 'The invite link people tap to join the group chat. Starts with https://chat.whatsapp.com/',
  whatsappNumber: 'Optional. A number for direct messages: digits only with the country code, no plus sign (447700900123).',
  startTime: '24-hour time, like 18:30.',
  durationMinutes: 'In minutes. Use 0 when there is no fixed end.',
  slug: 'Becomes the web address, e.g. big-run-saltney. Lowercase letters, numbers and hyphens.',
  date: 'The day it happens. It moves to Past Events by itself afterwards.',
  tone: 'The colour of the card.',
  href: 'Where the card links to: /events/ for a page on this site, or a full https:// link.',
  gallery: 'Pictures shown on the event page.',
  picture: 'Choose from the picture library.',
};

export function humanize(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
