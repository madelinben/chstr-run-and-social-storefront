import * as z from 'zod/mini';

/**
 * The shape of every editable piece of content. The site build and the admin forms both use these,
 * so content that would break the site can never be saved. Empty string means "not set" for optional text.
 */

const optionalUrl = z.union([z.literal(''), z.url('Enter a full link starting with https://')]);
const requiredText = (label: string, min = 2) => z.string().check(z.trim(), z.minLength(min, `${label} is required`));
const slug = z.string().check(
  z.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only, e.g. big-run-saltney'),
  z.refine((value) => value !== 'past', 'This word is used by the archive page. Pick another.'),
);
const pictureId = z.string().check(z.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Pick a picture from the library'));
/** A site path ("/events/") or a full link. */
const linkTarget = z.string().check(z.refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), 'Start with / for a page on this site, or https:// for another site'));

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const SESSION_IDS = ['run', 'football', 'netball'] as const;
export type SessionId = (typeof SESSION_IDS)[number];

export const settingsSchema = z.object({
  whatsappGroupUrl: optionalUrl,
  whatsappNumber: z.string().check(z.regex(/^\d*$/, 'Digits only, with the country code and no + (e.g. 447700900123)')),
  contactEmail: z.union([z.literal(''), z.email('Enter a valid email address')]),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  waiverUrl: optionalUrl,
  motto: requiredText('The motto', 5),
  routeNote: requiredText('The route note', 10),
  lightsNotice: z.object({ title: requiredText('The title'), text: requiredText('The text', 10) }),
});

export const sessionSchema = z.object({
  name: requiredText('The name'),
  dayName: z.enum(DAY_NAMES),
  startTime: z.string().check(z.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time like 18:30')),
  /** Minutes. Use 0 when there is no fixed end (the Monday run flows into the social). */
  durationMinutes: z.int().check(z.minimum(0, 'Zero or more'), z.maximum(600)),
  venueName: requiredText('The venue'),
  streetAddress: z.string(),
  postalCode: z.string(),
  locality: requiredText('The town or city'),
  bookingUrl: optionalUrl,
  title: requiredText('The heading'),
  blurb: requiredText('The short description', 5),
  calendar: requiredText('The calendar text', 5),
});
export const sessionsSchema = z.object({ run: sessionSchema, football: sessionSchema, netball: sessionSchema });

export const eventSchema = z.object({
  slug,
  title: requiredText('The title', 3),
  date: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'), z.refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), 'That is not a real date')),
  summary: requiredText('The summary', 10),
  highlights: z.array(requiredText('A highlight', 2)),
  partner: z.string(),
  where: z.string(),
  gallery: z.array(pictureId).check(z.minLength(1, 'Pick at least one picture')),
});
export const eventsSchema = z.array(eventSchema).check(z.superRefine((events, context) => {
  const seen = new Set<string>();
  events.forEach((event, index) => {
    if (seen.has(event.slug)) context.addIssue({ code: 'custom', path: [index, 'slug'], message: 'Another event already uses this web address' });
    seen.add(event.slug);
  });
}));

export const leaderSchema = z.object({
  name: requiredText('The name'),
  role: requiredText('The role', 3),
  welcome: requiredText('The welcome line', 5),
  kudos: requiredText('The kudos line', 3),
  tone: z.enum(['lime', 'pale', 'white']),
});
export const legendSchema = z.object({ name: requiredText('The name'), reason: requiredText('The reason', 5) });
export const membersSchema = z.object({
  leaders: z.array(leaderSchema),
  legends: z.array(legendSchema),
  glossary: z.array(z.object({ term: requiredText('The word'), meaning: requiredText('The meaning', 5) })),
});

export const pictureSchema = z.object({
  id: pictureId,
  alt: requiredText('The description (alt text)', 5),
  gallery: z.boolean(),
  hero: z.boolean(),
});
export const picturesSchema = z.array(pictureSchema).check(z.superRefine((pictures, context) => {
  const seen = new Set<string>();
  pictures.forEach((picture, index) => {
    if (seen.has(picture.id)) context.addIssue({ code: 'custom', path: [index, 'id'], message: 'Two pictures share this name' });
    seen.add(picture.id);
  });
}));

export const homeSchema = z.object({
  mondaySteps: z.array(z.object({ title: requiredText('The title'), text: requiredText('The text', 5), picture: pictureId })).check(z.length(3, 'Exactly three steps')),
  activities: z.array(z.object({ name: requiredText('The name'), note: requiredText('The note', 3), picture: pictureId, tone: z.enum(['lime', 'pale', 'white']), href: linkTarget })).check(z.minLength(1), z.maxLength(8)),
  tickerTop: z.array(requiredText('A word', 1)).check(z.minLength(2, 'At least two words')),
  tickerBottom: z.array(requiredText('A word', 1)).check(z.minLength(2, 'At least two words')),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SessionContent = z.infer<typeof sessionSchema>;
export type Sessions = z.infer<typeof sessionsSchema>;
export type EventContent = z.infer<typeof eventSchema>;
export type MembersContent = z.infer<typeof membersSchema>;
export type PictureContent = z.infer<typeof pictureSchema>;
export type HomeContent = z.infer<typeof homeSchema>;
export type Tone = 'lime' | 'pale' | 'white';

/** Every content file the admin can edit, with where it lives in the repo. */
export const CONTENT_FILES = {
  settings: { path: 'src/content/site/settings.json', schema: settingsSchema },
  sessions: { path: 'src/content/site/sessions.json', schema: sessionsSchema },
  events: { path: 'src/content/site/events.json', schema: eventsSchema },
  members: { path: 'src/content/site/members.json', schema: membersSchema },
  pictures: { path: 'src/content/site/pictures.json', schema: picturesSchema },
  home: { path: 'src/content/site/home.json', schema: homeSchema },
} as const;
export type ContentKey = keyof typeof CONTENT_FILES;

/** The whole site's content as the build and the admin see it. */
export interface SiteContentData {
  settings: Settings;
  sessions: Sessions;
  events: EventContent[];
  members: MembersContent;
  pictures: PictureContent[];
  home: HomeContent;
}
