import type { ImageMetadata } from 'astro';
import { z } from 'zod';
import { CONTENT_FILES, type ContentKey, type SiteContentData } from '@/data/Content/schemas';
import { crossCheckContent } from '@/data/Content/validate-content';
import settingsJson from '@/content/site/settings.json';
import sessionsJson from '@/content/site/sessions.json';
import eventsJson from '@/content/site/events.json';
import membersJson from '@/content/site/members.json';
import picturesJson from '@/content/site/pictures.json';
import homeJson from '@/content/site/home.json';

/**
 * All editable content, checked at build time. A bad edit stops the build with a plain-English message
 * instead of shipping a broken page. The admin edits the same JSON files and uses the same schemas.
 */
const raw: Record<ContentKey, unknown> = { settings: settingsJson, sessions: sessionsJson, events: eventsJson, members: membersJson, pictures: picturesJson, home: homeJson };

function parseFile<Schema extends z.ZodType>(key: ContentKey, schema: Schema): z.output<Schema> {
  const result = schema.safeParse(raw[key]);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(whole file)'}: ${issue.message}`);
    throw new Error(`Content problem in ${CONTENT_FILES[key].path}:\n${lines.join('\n')}`);
  }
  return result.data;
}

const pictureFiles = import.meta.glob<{ default: ImageMetadata }>('/src/assets/{gallery,uploads}/*.{webp,jpg,jpeg,png,avif}', { eager: true });

/** Picture id (file name without extension) to its image. */
export const pictureImages: ReadonlyMap<string, ImageMetadata> = new Map(
  Object.entries(pictureFiles).map(([path, module]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''), module.default]),
);

export const siteContent: SiteContentData = {
  settings: parseFile('settings', CONTENT_FILES.settings.schema),
  sessions: parseFile('sessions', CONTENT_FILES.sessions.schema),
  events: parseFile('events', CONTENT_FILES.events.schema),
  members: parseFile('members', CONTENT_FILES.members.schema),
  pictures: parseFile('pictures', CONTENT_FILES.pictures.schema),
  home: parseFile('home', CONTENT_FILES.home.schema),
};

const problems = crossCheckContent(siteContent, new Set(pictureImages.keys()));
if (problems.length > 0) throw new Error(`Content problem:\n${problems.map((line) => `  ${line}`).join('\n')}`);
