import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { BARCODE_TYPES } from './constants';
import { useScannerBeep } from './hooks/useScannerBeep';
import { useBarcodeScan } from './hooks/useBarcodeScan';
import { ResultCard } from './components/ResultCard';
import { Flashcard } from './components/Flashcard';
import { PermissionGate } from './components/PermissionGate';
import { Footer, Header, Reticle } from './components/ScannerChrome';
import { getFlashcard } from './flashcards';

export function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const playBeep = useScannerBeep();
  const { scan, handleBarcode, reset } = useBarcodeScan(playBeep);
  const flashcard = scan ? getFlashcard(scan.data) : null;

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
