import { useState } from 'react';
import type { PictureContent } from '@/data/Content/schemas';
import { pictureIdFromFileName, resizeToWebp } from '@/features/content-admin/utilities/picture-resize';

export interface PendingUpload {
  base64: string;
  preview: string;
}

interface PanelProps {
  pictures: readonly PictureContent[];
  onChange: (pictures: PictureContent[]) => void;
  uploads: ReadonlyMap<string, PendingUpload>;
  onUpload: (id: string, upload: PendingUpload) => void;
  /** Where each picture id is used, for the delete warning. */
  usage: ReadonlyMap<string, string[]>;
}

const inputClass = 'w-full min-h-11 rounded-xl border-4 border-border bg-card px-3 py-2 text-base';
const buttonClass = 'min-h-10 rounded-full border-4 border-border bg-card px-4 py-1 font-display text-sm font-extrabold uppercase press';

export function PicturesPanel({ pictures, onChange, uploads, onUpload, usage }: PanelProps) {
  const [draftId, setDraftId] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const [draftFile, setDraftFile] = useState<{ base64: string; preview: string } | undefined>();
  const [problem, setProblem] = useState('');

  const update = (id: string, patch: Partial<PictureContent>) => onChange(pictures.map((picture) => (picture.id === id ? { ...picture, ...patch } : picture)));

  async function choose(file: File | undefined) {
    if (!file) return;
    setProblem('');
    try {
      const { base64 } = await resizeToWebp(file);
      setDraftFile({ base64, preview: `data:image/webp;base64,${base64}` });
      if (!draftId) setDraftId(pictureIdFromFileName(file.name));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'That file could not be read as a picture.');
    }
  }

  function add() {
    if (!draftFile) return;
    if (pictures.some((picture) => picture.id === draftId)) {
      setProblem('A picture with that name already exists. Choose another name.');
      return;
    }
    onUpload(draftId, draftFile);
    onChange([...pictures, { id: draftId, alt: draftAlt, gallery: true, hero: false }]);
    setDraftId('');
    setDraftAlt('');
    setDraftFile(undefined);
    setProblem('');
  }

  function remove(picture: PictureContent) {
    const places = usage.get(picture.id) ?? [];
    if (places.length > 0 && !window.confirm(`"${picture.id}" is used by ${places.join(', ')}. Removing it will block saving until those are changed. Remove anyway?`)) return;
    onChange(pictures.filter((existing) => existing.id !== picture.id));
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3 rounded-2xl border-4 border-border bg-secondary p-4">
        <legend className="px-2 font-display text-sm font-bold uppercase tracking-wide">Add a picture</legend>
        <p className="text-sm">Pick a photo. It is shrunk and converted here before it is saved, so large phone photos are fine.</p>
        <label className="block font-semibold">
          Photo
          <input type="file" accept="image/*" className={inputClass} onChange={(event) => void choose(event.target.files?.[0])} />
        </label>
        {draftFile && <img src={draftFile.preview} alt="Preview of the chosen photo" className="max-h-48 rounded-xl border-4 border-border" />}
        <label className="block font-semibold">
          Name (letters, numbers, hyphens)
          <input className={inputClass} value={draftId} onChange={(event) => setDraftId(event.target.value)} />
        </label>
        <label className="block font-semibold">
          Description for people who cannot see it
          <input className={inputClass} value={draftAlt} onChange={(event) => setDraftAlt(event.target.value)} />
        </label>
        {problem && <p role="alert" className="font-bold text-destructive">{problem}</p>}
        <button type="button" className={`${buttonClass} bg-accent`} disabled={!draftFile || draftId.length < 2 || draftAlt.trim().length < 5} onClick={add}>Add picture</button>
      </fieldset>

      <ul className="space-y-3">
        {pictures.map((picture) => {
          const upload = uploads.get(picture.id);
          return (
            <li key={picture.id} className="space-y-3 rounded-2xl border-4 border-border p-4">
              <div className="flex flex-wrap items-center gap-3">
                {upload && <img src={upload.preview} alt={picture.alt} className="size-16 rounded-lg object-cover" />}
                <p className="font-display font-bold">{picture.id}{upload ? ' (new)' : ''}</p>
              </div>
              <label className="block font-semibold">
                Description
                <input className={inputClass} value={picture.alt} onChange={(event) => update(picture.id, { alt: event.target.value })} />
              </label>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <label className="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" className="size-6" checked={picture.gallery} onChange={(event) => update(picture.id, { gallery: event.target.checked })} />Show in gallery</label>
                <label className="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" className="size-6" checked={picture.hero} onChange={(event) => update(picture.id, { hero: event.target.checked })} />Show in home collage</label>
                <button type="button" className={buttonClass} onClick={() => remove(picture)} aria-label={`Remove picture ${picture.id}`}>Remove</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
