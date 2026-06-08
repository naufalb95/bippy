import { useCallback, useRef, useState } from 'react';
import type { BarcodeScanningResult } from 'expo-camera';
import { SAME_CODE_DEBOUNCE_MS } from '../constants';

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

  const reset = useCallback(() => {
    setScan(null);
    lockedRef.current = false;
  }, []);

  // Inject a scan from outside the camera (e.g. a deep link opened from
  // the system camera). Bypasses the camera-side same-code debounce but
  // still respects the lock so a tap-to-dismiss flow stays consistent.
  const injectScan = useCallback(
    (data: string) => {
      if (lockedRef.current) return;
      lastRef.current = { data, at: Date.now() };
      lockedRef.current = true;
      onScanned();
      setScan({ data, type: 'qr' });
    },
    [onScanned],
  );

  return { scan, handleBarcode, injectScan, reset };
}
