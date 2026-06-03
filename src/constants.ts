import type { BarcodeType } from 'expo-camera';

export const BARCODE_TYPES: BarcodeType[] = [
  'qr',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'codabar',
  'itf14',
  'pdf417',
  'aztec',
  'datamatrix',
];

export const FOCUS_RING_SIZE = 80;

// Auto-dismiss the scan result so the cashier flow stays hands-free.
export const RESULT_AUTO_DISMISS_MS = 3000;

// Ignore the same code if it re-fires within this window — prevents
// machine-gun beeps while a barcode is held in frame.
export const SAME_CODE_DEBOUNCE_MS = 1200;
