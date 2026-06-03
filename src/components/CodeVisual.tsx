import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Barcode from 'react-native-barcode-svg';

type Props = {
  data: string;
  type: string;
  size?: number;
};

// expo-camera type → JsBarcode format (react-native-barcode-svg).
// NOTE: JsBarcode does not support UPC-E or Code 93, and 2D non-QR
// formats (PDF417, Aztec, DataMatrix) have no widely-supported RN
// renderer. Those fall through and we render no visual.
const BARCODE_FORMAT: Record<string, string> = {
  ean13: 'EAN13',
  ean8: 'EAN8',
  upc_a: 'UPC',
  code128: 'CODE128',
  code39: 'CODE39',
  codabar: 'codabar',
  itf14: 'ITF14',
};

// Normalise the decoded payload for the chosen renderer. Different
// scanners return slightly different shapes for the same physical code
// (especially iOS, which often returns UPC-A as a leading-zero EAN-13).
function normalise(type: string, data: string): { value: string; format?: string } {
  const trimmed = data.trim();

  // iOS commonly reports UPC-A as 13 digits with a leading 0 (EAN-13
  // padding). JsBarcode's UPC format expects exactly 12 digits; if we
  // see the 13-digit form, render as EAN13 — they're visually identical
  // for UPC-A codes by spec.
  if (type === 'upc_a' && /^0\d{12}$/.test(trimmed)) {
    return { value: trimmed, format: 'EAN13' };
  }

  // EAN-13 returned by some scanners with whitespace or stray chars.
  if (type === 'ean13' && /^\d{13}$/.test(trimmed)) {
    return { value: trimmed, format: 'EAN13' };
  }

  return { value: trimmed, format: BARCODE_FORMAT[type] };
}

export function CodeVisual({ data, type, size = 180 }: Props) {
  if (type === 'qr') {
    return (
      <View style={styles.wrap}>
        <QRCode
          value={data.trim()}
          size={size}
          backgroundColor="#fff"
          color="#000"
          ecl="M"
          quietZone={8}
        />
      </View>
    );
  }

  const { value, format } = normalise(type, data);
  if (!format) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.barcodePlate}>
        <Barcode
          value={value}
          format={format}
          maxWidth={size * 1.4}
          height={size * 0.55}
          singleBarWidth={2}
          lineColor="#000"
          backgroundColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodePlate: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
