// Flashcard deck. Each card is keyed by a UUIDv4; print/stick a QR
// encoding `bippy://<uuid>` and Bippy! will pop the matching card on
// scan. The `bippy://` URL form is also what makes iOS/Android's
// system camera offer to open Bippy! directly when scanned outside
// the app (requires a standalone build — Expo Go uses its own scheme).
//
// Legacy `bippy:<uuid>` (no `//`) is still recognised when scanned in
// the app, so old stickers keep working.
//
// Adding a card:
//   1. Generate a uuid (any uuidv4).
//   2. Drop the video into `assets/flashcards/videos/<something>.mp4`.
//   3. Add an entry below with `video: require('...')`.
//   4. Generate/print a QR encoding `bippy://<uuid>` and stick it on the toy.

export type Flashcard = {
  id: string;
  name: string;
  // Video source. Either a bundled `require()` (returns a number) or a
  // remote URL string — typically a public Vercel Blob URL produced by
  // scripts/upload-flashcard.js. Optional so a card can exist before
  // the media is added; the UI shows a "Video coming soon!" placeholder
  // until then.
  video?: number | string;
};

export const FLASHCARDS: Record<string, Flashcard> = {
  '12812dd3-a9a2-4c93-97da-cc8cca0e8cd1': {
    id: '12812dd3-a9a2-4c93-97da-cc8cca0e8cd1',
    name: 'Elephant',
    video: 'https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/elephant.mp4',
  },
  'aac02be3-1533-4e7c-9861-14e45ac37f7e': {
    id: 'aac02be3-1533-4e7c-9861-14e45ac37f7e',
    name: 'Giraffe',
    video: 'https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/giraffe.mp4',
  },
  '5c817e0b-83aa-4d72-8d33-a1488e2bfc9f': {
    id: '5c817e0b-83aa-4d72-8d33-a1488e2bfc9f',
    name: 'Cat',
    video: 'https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/cat.mp4',
  },
};

/**
 * Extract a flashcard from a scanned/linked payload.
 *
 * Accepts:
 *   bippy://<uuid>    — preferred; works as a URL deep link
 *   bippy:<uuid>      — legacy; in-app scans only
 *
 * Returns null for anything else, leaving the generic result card to
 * handle non-flashcard codes.
 */
export function getFlashcard(data: string): Flashcard | null {
  const trimmed = data.trim().toLowerCase();
  let rest: string | null = null;
  if (trimmed.startsWith('bippy://')) rest = trimmed.slice('bippy://'.length);
  else if (trimmed.startsWith('bippy:')) rest = trimmed.slice('bippy:'.length);
  if (rest === null) return null;
  // Tolerate trailing slashes, query strings, paths.
  const id = rest.split(/[/?#]/)[0].trim();
  return FLASHCARDS[id] ?? null;
}
