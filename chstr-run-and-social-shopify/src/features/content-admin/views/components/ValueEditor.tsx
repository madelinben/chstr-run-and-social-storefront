import { useId } from 'react';
import { BLANK_ITEMS, FIELD_HELP, FIXED_CHOICES, LONG_TEXT, humanize } from '@/features/content-admin/utilities/blank-items';

interface EditorProps {
  value: unknown;
  onChange: (next: unknown) => void;
  /** Field name this value sits under; decides the kind of input. */
  name: string;
  pictureIds: readonly string[];
  /** Hide the label (used for list rows that already have a heading). */
  bare?: boolean;
}

const inputClass = 'w-full min-h-11 rounded-xl border-4 border-border bg-card px-3 py-2 text-base';
const buttonClass = 'min-h-10 rounded-full border-4 border-border bg-card px-4 py-1 font-display text-sm font-extrabold uppercase press';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function rowTitle(value: unknown, index: number): string {
  if (isRecord(value)) {
    for (const key of ['title', 'name', 'term', 'question']) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate) return candidate;
    }
  }
  return `Item ${index + 1}`;
}

/** Edits any piece of content by looking at its shape: text, switches, choices, lists and groups. */
export function ValueEditor({ value, onChange, name, pictureIds, bare = false }: EditorProps) {
  const id = useId();
  const help = FIELD_HELP[name];
  const label = bare ? undefined : <label htmlFor={id} className="block font-display text-sm font-bold uppercase tracking-wide">{humanize(name)}</label>;
  const helpText = help && !bare ? <p id={`${id}-help`} className="text-sm text-muted-foreground">{help}</p> : null;
  const describedBy = help && !bare ? `${id}-help` : undefined;
  const choices = name === 'picture' || name === 'gallery' ? pictureIds : FIXED_CHOICES[name];

  if (typeof value === 'boolean') {
    return (
      <label className="flex min-h-11 items-center gap-3 font-semibold">
        <input type="checkbox" className="size-6" checked={value} onChange={(event) => onChange(event.target.checked)} aria-describedby={describedBy} />
        {humanize(name)}
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="space-y-1">
        {label}
        <input id={id} type="number" className={inputClass} value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={describedBy} />
        {helpText}
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div className="space-y-1">
        {label}
        {choices ? (
          <select id={id} className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy} aria-label={bare ? humanize(name) : undefined}>
            {!choices.includes(value) && <option value={value}>{value || 'Choose…'}</option>}
            {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>
        ) : LONG_TEXT.has(name) || value.length > 90 ? (
          <textarea id={id} className={`${inputClass} min-h-28`} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy} aria-label={bare ? humanize(name) : undefined} />
        ) : (
          <input id={id} type={name === 'date' ? 'date' : 'text'} className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy} aria-label={bare ? humanize(name) : undefined} />
        )}
        {helpText}
      </div>
    );
  }

  if (Array.isArray(value)) {
    const blank = BLANK_ITEMS[name];
    const items: readonly unknown[] = value;
    const move = (from: number, to: number) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    };
    const primitive = items.every((item) => typeof item === 'string');
    return (
      <fieldset className="space-y-3 rounded-2xl border-4 border-border p-4">
        <legend className="px-2 font-display text-sm font-bold uppercase tracking-wide">{humanize(name)}</legend>
        {items.map((item, index) => (
          <div key={index} className={primitive ? 'flex items-end gap-2' : 'space-y-3 rounded-xl bg-secondary p-3'}>
            {!primitive && <p className="font-display font-bold">{rowTitle(item, index)}</p>}
            <div className={primitive ? 'flex-1' : ''}>
              <ValueEditor value={item} name={name} pictureIds={pictureIds} bare onChange={(next) => onChange(items.map((existing, position) => (position === index ? next : existing)))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClass} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${rowTitle(item, index)} up`}>Up</button>
              <button type="button" className={buttonClass} disabled={index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${rowTitle(item, index)} down`}>Down</button>
              <button type="button" className={buttonClass} onClick={() => onChange(items.filter((_, position) => position !== index))} aria-label={`Remove ${rowTitle(item, index)}`}>Remove</button>
            </div>
          </div>
        ))}
        {blank !== undefined && <button type="button" className={`${buttonClass} bg-accent`} onClick={() => onChange([...items, structuredClone(blank)])}>Add {humanize(name).toLowerCase()}</button>}
      </fieldset>
    );
  }

  if (isRecord(value)) {
    return (
      <fieldset className={bare ? 'space-y-4' : 'space-y-4 rounded-2xl border-4 border-border p-4'}>
        {!bare && <legend className="px-2 font-display text-sm font-bold uppercase tracking-wide">{humanize(name)}</legend>}
        {Object.entries(value).map(([key, child]) => (
          <ValueEditor key={key} name={key} value={child} pictureIds={pictureIds} onChange={(next) => onChange({ ...value, [key]: next })} />
        ))}
      </fieldset>
    );
  }

  return null;
}
