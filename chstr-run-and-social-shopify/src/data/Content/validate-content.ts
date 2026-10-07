import type { SiteContentData } from '@/data/Content/schemas';

/**
 * Checks that hold across files (every picture an event, the home page or a card points at must exist; the hero and gallery
 * must have something to show). Returns plain-English problems, empty when the content is fine.
 * `libraryIds` are the picture ids that have an image file, including ones the editor has just uploaded.
 */
export function crossCheckContent(content: SiteContentData, libraryIds: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const known = new Set(content.pictures.map((picture) => picture.id));

  for (const picture of content.pictures) if (!libraryIds.has(picture.id)) problems.push(`Picture "${picture.id}" is listed but its image file is missing`);
  for (const id of libraryIds) if (!known.has(id)) problems.push(`Image "${id}" has no entry in the picture list, so it has no description`);

  const needs = (where: string, id: string) => {
    if (!known.has(id)) problems.push(`${where} uses the picture "${id}", which is not in the library`);
  };
  content.events.forEach((event) => event.gallery.forEach((id) => needs(`Event "${event.title}"`, id)));
  content.home.mondaySteps.forEach((step) => needs(`Monday step "${step.title}"`, step.picture));
  content.home.activities.forEach((activity) => needs(`Activity "${activity.name}"`, activity.picture));

  if (!content.pictures.some((picture) => picture.hero)) problems.push('At least one picture must be marked for the home collage');
  if (!content.pictures.some((picture) => picture.gallery)) problems.push('At least one picture must be marked for the gallery');
  return problems;
}

/** Where is this picture used? For warning before a delete. */
export function picturesInUse(content: Pick<SiteContentData, 'events' | 'home'>): Map<string, string[]> {
  const uses = new Map<string, string[]>();
  const add = (id: string, where: string) => uses.set(id, [...(uses.get(id) ?? []), where]);
  content.events.forEach((event) => event.gallery.forEach((id) => add(id, `event "${event.title}"`)));
  content.home.mondaySteps.forEach((step) => add(step.picture, `Monday step "${step.title}"`));
  content.home.activities.forEach((activity) => add(activity.picture, `activity "${activity.name}"`));
  return uses;
}
