import { useEffect, useRef, useState } from 'react';
import { resolveVideoSource } from '../videoCache';

type ResolvedSource = number | string;

type State =
  | { status: 'loading'; source: null }
  | { status: 'ready'; source: ResolvedSource }
  | { status: 'error'; source: null; error: Error };

/**
 * Resolves a flashcard video source through the LRU cache. Bundled
 * sources resolve synchronously; remote URLs may download on first use.
 */
export function useCachedVideoSource(input: number | string | undefined): State {
  const [state, setState] = useState<State>(() => {
    if (input === undefined) {
      return { status: 'loading', source: null };
    }
    if (typeof input === 'number') {
      return { status: 'ready', source: input };
    }
    return { status: 'loading', source: null };
  });

  // Guard against late state updates if the card is dismissed mid-download.
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (input === undefined) {
      setState({ status: 'loading', source: null });
      return;
    }
    if (typeof input === 'number') {
      setState({ status: 'ready', source: input });
      return;
    }

    setState({ status: 'loading', source: null });
    resolveVideoSource(input)
      .then((resolved) => {
        if (cancelledRef.current) return;
        setState({ status: 'ready', source: resolved });
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        setState({
          status: 'error',
          source: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [input]);

  return state;
}
