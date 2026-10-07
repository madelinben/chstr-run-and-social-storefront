import { siteContent } from '@/data/Content/site-content';

export const settings = siteContent.settings;
/** Editable in the admin under Settings. */
export const SITE_MOTTO = settings.motto;
/** The Monday route rule, in the club's words. Used on the home page, events, FAQs and llms.txt. */
export const ROUTE_NOTE = settings.routeNote;

/** Social and contact links that are set, ready to render. */
export const socialLinks = {
  instagram: settings.instagramUrl || undefined,
  facebook: settings.facebookUrl || undefined,
  whatsappGroup: settings.whatsappGroupUrl || undefined,
  whatsappNumber: settings.whatsappNumber || undefined,
  email: settings.contactEmail || undefined,
  waiver: settings.waiverUrl || undefined,
} as const;
