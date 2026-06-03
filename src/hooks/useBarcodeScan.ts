import { useCallback, useEffect, useRef, useState } from 'react';
import type { BarcodeScanningResult } from 'expo-camera';
import {
  RESULT_AUTO_DISMISS_MS,
  SAME_CODE_DEBOUNCE_MS,
} from '../constants';

export type Scan = { data: string; type: string };

export function useBarcodeScan(onScanned: () => void) {
  const [scan, setScan] = useState<Scan | null>(null);
  const lastRef = useRef<{ data: string | null; at: number }>({
    data: null,
    at: 0,
  });

  const handleBarcode = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      const now = Date.now();
      if (
        lastRef.current.data === data &&
        now - lastRef.current.at < SAME_CODE_DEBOUNCE_MS
      ) {
        return;
      }
      lastRef.current = { data, at: now };
      onScanned();
      setScan({ data, type });
    },
    [onScanned],
  );

  useEffect(() => {
    if (!scan) return;
    const t = setTimeout(() => setScan(null), RESULT_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [scan]);

  const reset = useCallback(() => setScan(null), []);

  return { scan, handleBarcode, reset };
}
