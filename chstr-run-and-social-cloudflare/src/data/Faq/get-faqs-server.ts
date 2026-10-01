import { getCollection } from 'astro:content';
import { plainText } from '@/utilities/plain-text';

/** Build-time read for schema.org: the same questions and answers the accordion shows, as plain text. */
export async function getFaqsServer() {
  const entries = (await getCollection('faqs')).sort((a, b) => a.data.position - b.data.position);
  return entries.map((entry) => ({ question: entry.data.question, answer: plainText(entry.body ?? '') }));
}
