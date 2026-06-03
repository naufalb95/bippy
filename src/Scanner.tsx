import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { BARCODE_TYPES } from './constants';
import { useScannerBeep } from './hooks/useScannerBeep';
import { useTapFocus } from './hooks/useTapFocus';
import { useBarcodeScan } from './hooks/useBarcodeScan';
import { FocusRing } from './components/FocusRing';
import { ResultCard } from './components/ResultCard';
import { PermissionGate } from './components/PermissionGate';
import { Footer, Header, Reticle } from './components/ScannerChrome';

export function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const playBeep = useScannerBeep();
  const { autofocus, focusPoint, focusAnim, handleTap } = useTapFocus();
  const { scan, handleBarcode, reset } = useBarcodeScan(playBeep);

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return <PermissionGate onRequest={requestPermission} />;
  }

  // Layering is load-bearing — see CLAUDE.md. Back→front:
  // CameraView → tap-catcher Pressable → FocusRing (none) → overlay (box-none).
  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        autofocus={autofocus}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={scan ? undefined : handleBarcode}
      />

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
        android_disableSound
      />

      {focusPoint && <FocusRing point={focusPoint} anim={focusAnim} />}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <Header />
        <Reticle />
        {scan ? <ResultCard scan={scan} onDismiss={reset} /> : <Footer />}
      </SafeAreaView>

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
