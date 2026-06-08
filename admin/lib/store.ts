import { list, put, del } from "@vercel/blob";
import type { Flashcard } from "./types";

// The whole deck lives in a single public JSON blob at a stable path.
// It only contains names + already-public video URLs, so public read
// access is fine — and it's what lets the mobile app fetch the live
// deck later without any secret.
const DECK_PATH = "flashcards/deck.json";

export async function readDeck(): Promise<Flashcard[]> {
  const { blobs } = await list({ prefix: DECK_PATH });
  const blob = blobs.find((b) => b.pathname === DECK_PATH);
  if (!blob) return [];
  // no-store: the deck changes on every edit; we never want a stale CDN copy.
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as Flashcard[]) : [];
}

export async function writeDeck(cards: Flashcard[]): Promise<void> {
  await put(DECK_PATH, JSON.stringify(cards, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

// Best-effort cleanup of a card's video blob when it lives in our bucket.
// Remote/3rd-party URLs are left alone.
export async function deleteVideoBlob(url?: string): Promise<void> {
  if (!url || !url.includes(".public.blob.vercel-storage.com/")) return;
  try {
    await del(url);
  } catch {
    // Non-fatal: a dangling blob is harmless; the deck entry is what matters.
  }
}
