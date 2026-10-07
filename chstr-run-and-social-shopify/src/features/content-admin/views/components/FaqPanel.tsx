import { faqSlug, type FaqDraft } from '@/features/content-admin/utilities/faq-file';

interface PanelProps {
  faqs: readonly FaqDraft[];
  onChange: (faqs: FaqDraft[]) => void;
}

const inputClass = 'w-full min-h-11 rounded-xl border-4 border-border bg-card px-3 py-2 text-base';
const buttonClass = 'min-h-10 rounded-full border-4 border-border bg-card px-4 py-1 font-display text-sm font-extrabold uppercase press';

export function FaqPanel({ faqs, onChange }: PanelProps) {
  const update = (slug: string, patch: Partial<FaqDraft>) => onChange(faqs.map((faq) => (faq.slug === slug ? { ...faq, ...patch } : faq)));
  const nextPosition = faqs.reduce((highest, faq) => Math.max(highest, faq.position), 0) + 10;

  return (
    <div className="space-y-4">
      <p>Questions show on the FAQs page in order of position (lowest first). Leave gaps like 10, 20, 30 so you can slot new ones in.</p>
      <ul className="space-y-3">
        {[...faqs].sort((first, second) => first.position - second.position).map((faq) => (
          <li key={faq.slug} className="space-y-3 rounded-2xl border-4 border-border p-4">
            <label className="block font-semibold">Question<input className={inputClass} value={faq.question} onChange={(event) => update(faq.slug, { question: event.target.value })} /></label>
            <label className="block font-semibold">Answer<textarea className={`${inputClass} min-h-28`} value={faq.answer} onChange={(event) => update(faq.slug, { answer: event.target.value })} /></label>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block font-semibold">Position<input type="number" min={0} className={`${inputClass} w-28`} value={faq.position} onChange={(event) => update(faq.slug, { position: Number(event.target.value) })} /></label>
              <button type="button" className={buttonClass} onClick={() => onChange(faqs.filter((existing) => existing.slug !== faq.slug))} aria-label={`Remove question: ${faq.question}`}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`${buttonClass} bg-accent`}
        onClick={() => onChange([...faqs, { slug: `new-question-${Date.now()}`, question: '', answer: '', position: nextPosition }])}
      >
        Add question
      </button>
    </div>
  );
}

/** File name for a FAQ: kept as is when it already exists, otherwise taken from the question. */
export function finalFaqSlug(faq: FaqDraft, taken: ReadonlySet<string>): string {
  if (!faq.slug.startsWith('new-question-')) return faq.slug;
  const base = faqSlug(faq.question) || 'question';
  let candidate = base;
  for (let count = 2; taken.has(candidate); count += 1) candidate = `${base}-${count}`;
  return candidate;
}
