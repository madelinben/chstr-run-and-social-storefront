export interface FaqDraft {
  /** File name without `.md`. */
  slug: string;
  question: string;
  position: number;
  answer: string;
}

/** Reads a FAQ markdown file: front matter with `question` and `position`, then the answer. */
export function parseFaq(slug: string, text: string): FaqDraft | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return undefined;
  const front = match[1] ?? '';
  const questionLine = /^question:\s*(.*)$/m.exec(front)?.[1]?.trim() ?? '';
  const position = Number(/^position:\s*(\d+)/m.exec(front)?.[1] ?? '0');
  const quoted = /^"(.*)"$/.test(questionLine) ? (JSON.parse(questionLine) as string) : questionLine.replace(/^'(.*)'$/, '$1');
  return { slug, question: quoted, position, answer: (match[2] ?? '').trim() };
}

/** JSON quoting is valid YAML, so colons and quotes in a question are safe. */
export function serializeFaq(faq: FaqDraft): string {
  return `---\nquestion: ${JSON.stringify(faq.question)}\nposition: ${faq.position}\n---\n\n${faq.answer.trim()}\n`;
}

export function faqSlug(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
