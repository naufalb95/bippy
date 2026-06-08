import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';

import { BARCODE_TYPES } from './constants';
import { useScannerBeep } from './hooks/useScannerBeep';
import { useBarcodeScan } from './hooks/useBarcodeScan';
import { ResultCard } from './components/ResultCard';
import { Flashcard } from './components/Flashcard';
import { PermissionGate } from './components/PermissionGate';
import { Footer, Header, Reticle } from './components/ScannerChrome';
import { useDeck } from './useDeck';

export function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const playBeep = useScannerBeep();
  const { scan, handleBarcode, injectScan, reset } = useBarcodeScan(playBeep);
  const { lookup } = useDeck();
  const flashcard = scan ? lookup(scan.data) : null;

  // Deep links — bippy://<uuid> from the system camera or a tapped link.
  // Only handle our own scheme so the exp://… URL that launches the app
  // in Expo Go doesn't pop a bogus result card. Unknown bippy:// UUIDs
  // still fall through to ResultCard (same as an in-app scan).
  useEffect(() => {
    const open = (url: string | null) => {
      if (url && url.trim().toLowerCase().startsWith('bippy:')) injectScan(url);
    };
    Linking.getInitialURL().then(open);
    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, [injectScan]);

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return <PermissionGate onRequest={requestPermission} />;
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={handleBarcode}
      />

      {!flashcard && (
        <SafeAreaView style={styles.overlay} pointerEvents="box-none">
          <Header />
          <Reticle />
          {scan ? (
            <ResultCard scan={scan} onDismiss={reset} />
          ) : (
            <Footer />
          )}
        </SafeAreaView>
      )}

      {flashcard && <Flashcard card={flashcard} onDismiss={reset} />}

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
