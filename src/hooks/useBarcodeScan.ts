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
  // Locked while a result card is on screen. Using a ref (not state) so we
  // never detach `onBarcodeScanned` from CameraView — detaching causes the
  // native scanner pipeline to tear down and re-init, freezing the preview.
  const lockedRef = useRef(false);

  const handleBarcode = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      if (lockedRef.current) return;

      const now = Date.now();
      if (
        lastRef.current.data === data &&
        now - lastRef.current.at < SAME_CODE_DEBOUNCE_MS
      ) {
        return;
      }
      lastRef.current = { data, at: now };
      lockedRef.current = true;
      onScanned();
      setScan({ data, type });
    },
    [onScanned],
  );

  useEffect(() => {
    if (!scan) return;
    const t = setTimeout(() => {
      setScan(null);
      lockedRef.current = false;
    }, RESULT_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [scan]);

  const reset = useCallback(() => {
    setScan(null);
    lockedRef.current = false;
  }, []);

  return { scan, handleBarcode, reset };
}
