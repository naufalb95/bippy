import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  type Deck,
  type Flashcard,
  fetchDeck,
  parseFlashcardId,
  readCachedDeck,
  writeCachedDeck,
} from './flashcards';

/**
 * Loads the flashcard deck from the admin API — with a disk cache for
 * instant/offline startup — and exposes a synchronous lookup by scanned
 * payload. Refreshes when the app returns to the foreground so cards
 * added in the admin app show up without a restart.
 */
export function useDeck() {
  const [deck, setDeck] = useState<Deck>({});

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchDeck();
      setDeck(fresh);
      writeCachedDeck(fresh);
    } catch {
      // Offline or unconfigured — keep whatever we already have (cache).
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Seed from the on-disk cache first (instant + offline), but don't
    // clobber a network result that may have already landed.
    readCachedDeck().then((cached) => {
      if (active && cached) {
        setDeck((cur) => (Object.keys(cur).length ? cur : cached));
      }
    });
    refresh();

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [refresh]);

  const lookup = useCallback(
    (data: string): Flashcard | null => {
      const id = parseFlashcardId(data);
      return id ? deck[id] ?? null : null;
    },
    [deck],
  );

  return { lookup, refresh };
}
