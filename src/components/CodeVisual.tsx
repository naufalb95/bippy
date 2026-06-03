import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Barcode from 'react-native-barcode-svg';

type Props = {
  data: string;
  type: string;
  size?: number;
};

// expo-camera type → JsBarcode format (react-native-barcode-svg).
// Anything not listed has no widely-supported RN renderer (PDF417/Aztec/
// DataMatrix) or isn't supported by JsBarcode (Code 93) — those fall back
// to no visual.
const BARCODE_FORMAT: Record<string, string> = {
  ean13: 'EAN13',
  ean8: 'EAN8',
  upc_a: 'UPC',
  upc_e: 'UPCE',
  code128: 'CODE128',
  code39: 'CODE39',
  codabar: 'codabar',
  itf14: 'ITF14',
};

export function CodeVisual({ data, type, size = 180 }: Props) {
  if (type === 'qr') {
    return (
      <View style={styles.wrap}>
        <QRCode value={data} size={size} backgroundColor="#fff" color="#000" />
      </View>
    );
  }

  const format = BARCODE_FORMAT[type];
  if (!format) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.barcodePlate}>
        <Barcode
          value={data}
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
