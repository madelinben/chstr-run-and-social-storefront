import { describe, expect, it } from 'vitest';
import { validateDraft } from '@/features/content-admin/utilities/validate-draft';
import { siteContent } from '@/data/Content/site-content';

const draft = { ...siteContent };
const images = new Set(siteContent.pictures.map((picture) => picture.id));

describe('validateDraft', () => {
  it('accepts the live content', () => {
    expect(validateDraft(draft, images).problems).toEqual([]);
  });

  it('names the field when a link is wrong', () => {
    const result = validateDraft({ ...draft, settings: { ...siteContent.settings, whatsappGroupUrl: 'not a link' } }, images);
    expect(result.problems.join(' ')).toContain('whatsappGroupUrl');
  });

  it('blocks an event that points at a missing picture', () => {
    const [first, ...rest] = siteContent.events;
    if (!first) throw new Error('seed has events');
    const result = validateDraft({ ...draft, events: [{ ...first, gallery: ['nope'] }, ...rest] }, images);
    expect(result.problems.join(' ')).toContain('"nope"');
  });

  it('blocks a picture whose image file is missing', () => {
    const result = validateDraft(draft, new Set());
    expect(result.problems.join(' ')).toContain('image file is missing');
  });
});
