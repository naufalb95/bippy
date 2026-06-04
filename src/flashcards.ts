// Flashcard deck. Each card is keyed by a UUIDv4; print/stick a QR
// encoding `bippy:<uuid>` and Bippy! will pop the matching card on scan.
//
// Adding a card:
//   1. Generate a uuid (any uuidv4).
//   2. Drop the video into `assets/flashcards/videos/<something>.mp4`.
//   3. Add an entry below with `video: require('...')`.
//   4. Generate/print a QR encoding `bippy:<uuid>` and stick it on the toy.

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
    // Drop the file at assets/flashcards/videos/elephant.mp4 then
    // uncomment the next line:
    video: require('../assets/flashcards/videos/elephant.mp4'),
  },
};

const QR_PREFIX = 'bippy:';

export function getFlashcard(data: string): Flashcard | null {
  const trimmed = data.trim();
  if (!trimmed.toLowerCase().startsWith(QR_PREFIX)) return null;
  const id = trimmed.slice(QR_PREFIX.length).trim().toLowerCase();
  return FLASHCARDS[id] ?? null;
}
