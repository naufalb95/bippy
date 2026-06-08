// The flashcard shape, mirroring src/flashcards.ts in the mobile app.
// Keyed by a UUIDv4; a QR encoding `bippy://<id>` pops the card on scan.
export type Flashcard = {
  id: string;
  name: string;
  // Public video URL (typically a Vercel Blob URL). Optional so a card
  // can exist before its media is uploaded — the app shows a
  // "Video coming soon!" placeholder until then.
  video?: string;
};
