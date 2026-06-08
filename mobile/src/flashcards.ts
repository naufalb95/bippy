// The flashcard deck lives in the admin database (Neon), served
// read-only at GET ${API_URL}/api/public/deck. The app fetches it on
// launch (and when returning to the foreground), caches it to disk for
// offline use, and looks cards up by the scanned `bippy://<uuid>`.
//
// There is no hardcoded deck in the app anymore — add/edit/remove cards
// from the admin web app. A scanned UUID that isn't in the deck falls
// through to the generic ResultCard (which just shows the raw code).

import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './constants';

export type Flashcard = {
  id: string;
  name: string;
  // Public video URL (Vercel Blob). Optional — the UI shows a
  // "Video coming soon!" placeholder until one is set.
  video?: string;
};

export type Deck = Record<string, Flashcard>;

/**
 * Extract the flashcard UUID from a scanned/linked payload.
 *
 * Accepts:
 *   bippy://<uuid>   — preferred; works as a URL deep link
 *   bippy:<uuid>     — legacy; in-app scans only
 *
 * Returns null for anything that isn't a bippy code.
 */
export function parseFlashcardId(data: string): string | null {
  const trimmed = data.trim().toLowerCase();
  let rest: string | null = null;
  if (trimmed.startsWith('bippy://')) rest = trimmed.slice('bippy://'.length);
  else if (trimmed.startsWith('bippy:')) rest = trimmed.slice('bippy:'.length);
  if (rest === null) return null;
  // Tolerate trailing slashes, query strings, paths.
  const id = rest.split(/[/?#]/)[0].trim();
  return id || null;
}

function indexById(cards: Flashcard[]): Deck {
  const deck: Deck = {};
  for (const c of cards) if (c?.id) deck[c.id] = c;
  return deck;
}

/**
 * Fetch the live deck from the admin API. Throws on network/HTTP error
 * so the caller can fall back to the cached copy.
 */
export async function fetchDeck(): Promise<Deck> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not set');
  const res = await fetch(`${API_URL}/api/public/deck`);
  if (!res.ok) throw new Error(`deck fetch failed (${res.status})`);
  const cards: Flashcard[] = await res.json();
  return indexById(cards);
}

// Persisted in the document dir (survives restarts) so the last-known
// deck is available instantly and offline.
const CACHE_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}bippy-deck.json`
  : null;

export async function readCachedDeck(): Promise<Deck | null> {
  if (!CACHE_FILE) return null;
  try {
    const info = await FileSystem.getInfoAsync(CACHE_FILE);
    if (!info.exists) return null;
    const json = await FileSystem.readAsStringAsync(CACHE_FILE);
    return indexById(JSON.parse(json) as Flashcard[]);
  } catch {
    return null;
  }
}

export async function writeCachedDeck(deck: Deck): Promise<void> {
  if (!CACHE_FILE) return;
  try {
    await FileSystem.writeAsStringAsync(
      CACHE_FILE,
      JSON.stringify(Object.values(deck)),
    );
  } catch {
    // Best effort — a missing cache just means a network fetch next launch.
  }
}
