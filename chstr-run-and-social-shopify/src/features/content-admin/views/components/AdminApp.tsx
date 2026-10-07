import { useEffect, useMemo, useState } from 'react';
import { CONTENT_FILES, eventsSchema, homeSchema, picturesSchema, type ContentKey, type PictureContent } from '@/data/Content/schemas';
import { picturesInUse } from '@/data/Content/validate-content';
import type { AdminAuth, ContentStore, FileChange } from '@/features/content-admin/models/content-store';
import { createGithubStore, createTokenAuth, type GithubTarget } from '@/features/content-admin/utilities/github-store';
import { validateDraft } from '@/features/content-admin/utilities/validate-draft';
import { parseFaq, serializeFaq, type FaqDraft } from '@/features/content-admin/utilities/faq-file';
import { FaqPanel, finalFaqSlug } from '@/features/content-admin/views/components/FaqPanel';
import { PicturesPanel, type PendingUpload } from '@/features/content-admin/views/components/PicturesPanel';
import { ValueEditor } from '@/features/content-admin/views/components/ValueEditor';

const IMAGE_FOLDERS = ['src/assets/gallery', 'src/assets/uploads'] as const;
const FAQ_FOLDER = 'src/content/faqs';

const SECTIONS = [
  { id: 'settings', label: 'Contact and links', help: 'WhatsApp group, email, social links, motto and the lights notice.' },
  { id: 'sessions', label: 'Weekly sessions', help: 'When and where the run, football and netball happen.' },
  { id: 'events', label: 'Special events', help: 'One-off events. They move to Past Events automatically.' },
  { id: 'members', label: 'Members', help: 'The people to look for, local legends and the Strava glossary.' },
  { id: 'home', label: 'Home page', help: 'The Monday steps, activity cards and scrolling words.' },
  { id: 'pictures', label: 'Pictures', help: 'Upload photos and say where they show.' },
  { id: 'faqs', label: 'FAQs', help: 'Questions and answers.' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

const EDITOR_KEYS = ['settings', 'sessions', 'events', 'members', 'home'] as const satisfies readonly ContentKey[];
type EditorKey = (typeof EDITOR_KEYS)[number];

interface Loaded {
  documents: Record<EditorKey, unknown>;
  pictures: PictureContent[];
  faqs: FaqDraft[];
  /** Picture id to the repository path of its image file. */
  imagePaths: Map<string, string>;
}

const buttonClass = 'min-h-11 rounded-full border-4 border-border bg-card px-6 py-2 font-display font-extrabold uppercase press';
const same = (first: unknown, second: unknown) => JSON.stringify(first) === JSON.stringify(second);
const asJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

async function loadEverything(store: ContentStore): Promise<Loaded> {
  const read = async (key: ContentKey): Promise<unknown> => {
    const text = await store.readText(CONTENT_FILES[key].path);
    if (text === undefined) throw new Error(`${CONTENT_FILES[key].path} was not found in the repository.`);
    return JSON.parse(text);
  };
  const [settings, sessions, events, members, home, picturesRaw] = await Promise.all([read('settings'), read('sessions'), read('events'), read('members'), read('home'), read('pictures')]);
  const pictures = picturesSchema.parse(picturesRaw);

  const imagePaths = new Map<string, string>();
  for (const folder of IMAGE_FOLDERS) for (const file of await store.listFiles(folder)) imagePaths.set(file.replace(/\.[^.]+$/, ''), `${folder}/${file}`);

  const faqs: FaqDraft[] = [];
  for (const file of await store.listFiles(FAQ_FOLDER)) {
    const slug = file.replace(/\.md$/, '');
    const text = await store.readText(`${FAQ_FOLDER}/${file}`);
    const faq = text === undefined ? undefined : parseFaq(slug, text);
    if (faq) faqs.push(faq);
  }
  return { documents: { settings, sessions, events, members, home }, pictures, faqs, imagePaths };
}

export interface AdminAppProps {
  target: GithubTarget;
}

export default function AdminApp({ target }: AdminAppProps) {
  const [auth, setAuth] = useState<AdminAuth | undefined>();
  const [store, setStore] = useState<ContentStore | undefined>();
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState<Loaded | undefined>();
  const [documents, setDocuments] = useState<Record<EditorKey, unknown> | undefined>();
  const [pictures, setPictures] = useState<PictureContent[]>([]);
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);
  const [uploads, setUploads] = useState<Map<string, PendingUpload>>(new Map());
  const [section, setSection] = useState<SectionId>('settings');
  const [message, setMessage] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const dirty = useMemo(
    () => saved !== undefined && documents !== undefined && (!same(documents, saved.documents) || !same(pictures, saved.pictures) || !same(faqs, saved.faqs) || uploads.size > 0),
    [saved, documents, pictures, faqs, uploads],
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function signIn() {
    setBusy(true);
    setMessage('Signing in…');
    try {
      const nextAuth = createTokenAuth(token);
      const nextStore = createGithubStore(target, nextAuth.authorizationHeader);
      const loaded = await loadEverything(nextStore);
      setAuth(nextAuth);
      setStore(nextStore);
      setSaved(loaded);
      setDocuments(loaded.documents);
      setPictures(loaded.pictures);
      setFaqs(loaded.faqs);
      setToken('');
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    auth?.signOut();
    setAuth(undefined);
    setStore(undefined);
    setSaved(undefined);
    setDocuments(undefined);
    setUploads(new Map());
    setMessage('Signed out.');
  }

  /** Where each picture is used, from the current draft (empty if the draft does not validate yet). */
  const usage = useMemo(() => {
    if (!documents) return new Map<string, string[]>();
    const events = eventsSchema.safeParse(documents.events);
    const home = homeSchema.safeParse(documents.home);
    if (!events.success || !home.success) return new Map<string, string[]>();
    return picturesInUse({ events: events.data, home: home.data });
  }, [documents]);

  async function save() {
    if (!store || !saved || !documents) return;
    setBusy(true);
    setProblems([]);
    setMessage('Checking…');
    const found: string[] = [];
    const taken = new Set(faqs.filter((faq) => !faq.slug.startsWith('new-question-')).map((faq) => faq.slug));
    const finalFaqs = faqs.map((faq) => {
      const slug = finalFaqSlug(faq, taken);
      taken.add(slug);
      return { ...faq, slug };
    });
    finalFaqs.forEach((faq) => {
      if (faq.question.trim().length < 5) found.push('A FAQ needs a question of at least 5 characters.');
      if (faq.answer.trim().length === 0) found.push(`The FAQ "${faq.question}" needs an answer.`);
    });

    const result = validateDraft({ ...documents, pictures }, new Set([...saved.imagePaths.keys(), ...uploads.keys()]));
    found.push(...result.problems);
    if (!result.content || found.length > 0) {
      setProblems(found);
      setMessage('Nothing was saved. Fix the points below and try again.');
      setBusy(false);
      return;
    }
    const { content } = result;

    const changes: FileChange[] = [];
    for (const key of EDITOR_KEYS) if (!same(documents[key], saved.documents[key])) changes.push({ path: CONTENT_FILES[key].path, text: asJson(content[key]) });
    if (!same(pictures, saved.pictures)) changes.push({ path: CONTENT_FILES.pictures.path, text: asJson(content.pictures) });
    for (const [id, upload] of uploads) if (pictures.some((picture) => picture.id === id)) changes.push({ path: `src/assets/uploads/${id}.webp`, base64: upload.base64 });
    for (const id of [...saved.imagePaths.keys()].filter((candidate) => !pictures.some((picture) => picture.id === candidate))) {
      const path = saved.imagePaths.get(id);
      if (path) changes.push({ path, remove: true });
    }
    for (const faq of finalFaqs) {
      const before = saved.faqs.find((candidate) => candidate.slug === faq.slug);
      if (!before || !same(before, faq)) changes.push({ path: `${FAQ_FOLDER}/${faq.slug}.md`, text: serializeFaq(faq) });
    }
    for (const before of saved.faqs) if (!finalFaqs.some((faq) => faq.slug === before.slug)) changes.push({ path: `${FAQ_FOLDER}/${before.slug}.md`, remove: true });

    try {
      setMessage('Saving…');
      await store.commit('content: update site content from the admin', changes);
      const nextPaths = new Map(saved.imagePaths);
      for (const id of uploads.keys()) if (pictures.some((picture) => picture.id === id)) nextPaths.set(id, `src/assets/uploads/${id}.webp`);
      for (const id of [...nextPaths.keys()]) if (!pictures.some((picture) => picture.id === id)) nextPaths.delete(id);
      setSaved({ documents, pictures, faqs: finalFaqs, imagePaths: nextPaths });
      setFaqs(finalFaqs);
      setUploads(new Map());
      setMessage('Saved. The site updates in about two minutes once the build finishes.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Saving failed. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  }

  if (!auth || !documents || !saved) {
    return (
      <form
        className="mx-auto max-w-xl space-y-4 rounded-3xl border-4 border-border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn();
        }}
      >
        <h1 className="text-4xl">Site admin</h1>
        <p>Sign in to edit the site content. Products are managed in Shopify, not here.</p>
        <label className="block font-semibold">
          Access token
          <input type="password" autoComplete="off" className="mt-1 w-full min-h-11 rounded-xl border-4 border-border bg-background px-3 py-2" value={token} onChange={(event) => setToken(event.target.value)} aria-describedby="token-help" />
        </label>
        <p id="token-help" className="text-sm text-muted-foreground">A GitHub fine-grained token for <strong>{target.repository}</strong> with Contents set to read and write. It stays in this tab only and is forgotten when you close it. See docs/ADMIN.md.</p>
        <button type="submit" className={`${buttonClass} bg-accent`} disabled={busy || token.trim().length < 20}>Sign in</button>
        <p role="status" aria-live="polite" className="font-semibold">{message}</p>
      </form>
    );
  }

  const pictureIds = pictures.map((picture) => picture.id);
  const active = SECTIONS.find((candidate) => candidate.id === section);
  const editorKey = EDITOR_KEYS.find((key) => key === section);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Site admin</h1>
        <button type="button" className={buttonClass} onClick={signOut}>Sign out</button>
      </header>

      <nav aria-label="Sections" className="flex flex-wrap gap-2">
        {SECTIONS.map((candidate) => (
          <button key={candidate.id} type="button" aria-current={candidate.id === section ? 'page' : undefined} className={`${buttonClass} ${candidate.id === section ? 'bg-accent' : ''}`} onClick={() => setSection(candidate.id)}>{candidate.label}</button>
        ))}
      </nav>

      <section aria-labelledby="section-title" className="space-y-4">
        <h2 id="section-title" className="text-2xl">{active?.label}</h2>
        <p>{active?.help}</p>
        {editorKey && <ValueEditor name={editorKey} bare value={documents[editorKey]} pictureIds={pictureIds} onChange={(next) => setDocuments({ ...documents, [editorKey]: next })} />}
        {section === 'pictures' && (
          <PicturesPanel pictures={pictures} onChange={setPictures} uploads={uploads} usage={usage} onUpload={(id, upload) => setUploads(new Map(uploads).set(id, upload))} />
        )}
        {section === 'faqs' && <FaqPanel faqs={faqs} onChange={setFaqs} />}
      </section>

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t-4 border-border bg-background p-4">
        {problems.length > 0 && (
          <ul role="alert" className="max-h-40 list-disc space-y-1 overflow-auto pl-6 font-semibold">
            {problems.map((problem) => <li key={problem}>{problem}</li>)}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={`${buttonClass} bg-accent`} disabled={busy || !dirty} onClick={() => void save()}>Save all changes</button>
          <p role="status" aria-live="polite" className="font-semibold">{message || (dirty ? 'You have unsaved changes.' : 'Everything is saved.')}</p>
        </div>
      </div>
    </div>
  );
}
