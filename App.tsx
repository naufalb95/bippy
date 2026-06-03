import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
  type FocusMode,
} from 'expo-camera';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

const BARCODE_TYPES: BarcodeType[] = [
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

type Scan = { data: string; type: string };

const FOCUS_RING_SIZE = 80;

export default function App() {
  return (
    <SafeAreaProvider>
      <Scanner />
    </SafeAreaProvider>
  );
}

function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scan, setScan] = useState<Scan | null>(null);
  const lastScanRef = useRef<{ data: string | null; at: number }>({
    data: null,
    at: 0,
  });

  // Default continuous autofocus; flipping briefly to 'on' forces a refocus.
  const [autofocus, setAutofocus] = useState<FocusMode>('off');
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const focusAnim = useRef(new Animated.Value(0)).current;
  const refocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beep = useAudioPlayer(require('./assets/beep.wav'));

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      if (refocusTimer.current) clearTimeout(refocusTimer.current);
    };
  }, []);

  // Auto-dismiss the result after 5s so scanning resumes hands-free.
  useEffect(() => {
    if (!scan) return;
    const t = setTimeout(() => setScan(null), 3000);
    return () => clearTimeout(t);
  }, [scan]);

  const handleTapFocus = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      setFocusPoint({ x: locationX, y: locationY });

      // Toggle autofocus to force the camera to re-acquire focus.
      setAutofocus('on');
      if (refocusTimer.current) clearTimeout(refocusTimer.current);
      refocusTimer.current = setTimeout(() => setAutofocus('off'), 80);

      focusAnim.setValue(0);
      Animated.sequence([
        Animated.timing(focusAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.delay(450),
        Animated.timing(focusAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setFocusPoint(null);
      });
    },
    [focusAnim],
  );

  const handleBarcode = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      const now = Date.now();
      // Same code within 1.2s = ignore (keeps it from re-firing while held up).
      if (
        lastScanRef.current.data === data &&
        now - lastScanRef.current.at < 1200
      ) {
        return;
      }
      lastScanRef.current = { data, at: now };
      try {
        beep.seekTo(0);
        beep.play();
      } catch {}
      setScan({ data, type });
    },
    [beep],
  );

  const resetScan = () => setScan(null);

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Camera permission needed</Text>
        <Text style={styles.subtitle}>
          We need the camera to scan barcodes and QR codes.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

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
        onPress={handleTapFocus}
        android_disableSound
      />

      {focusPoint && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.focusRing,
            {
              left: focusPoint.x - FOCUS_RING_SIZE / 2,
              top: focusPoint.y - FOCUS_RING_SIZE / 2,
              opacity: focusAnim,
              transform: [
                {
                  scale: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.4, 1],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerText}>Point at a barcode</Text>
        </View>

        <View style={styles.reticleWrap} pointerEvents="none">
          <View style={styles.reticle} />
        </View>

        {scan ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{formatType(scan.type)}</Text>
            <Text
              style={styles.resultText}
              numberOfLines={4}
              adjustsFontSizeToFit
            >
              {scan.data}
            </Text>
            <Pressable style={styles.button} onPress={resetScan}>
              <Text style={styles.buttonText}>Scan again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Hold steady — it'll beep when it sees one.
            </Text>
            <Text style={styles.footerHint}>Tap anywhere to focus</Text>
          </View>
        )}
      </SafeAreaView>

      <StatusBar style="light" />
    </View>
  );
}

function formatType(type: string | undefined): string {
  if (!type) return 'Code';
  return String(type).replace(/[_-]/g, ' ').toUpperCase();
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0d12',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  reticleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.85,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  footerHint: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.65,
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  focusRing: {
    position: 'absolute',
    width: FOCUS_RING_SIZE,
    height: FOCUS_RING_SIZE,
    borderRadius: FOCUS_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#7ee787',
    shadowColor: '#7ee787',
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  resultCard: {
    margin: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(16,18,24,0.92)',
    gap: 12,
  },
  resultLabel: {
    color: '#7ee787',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd2dc',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3478f6',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
