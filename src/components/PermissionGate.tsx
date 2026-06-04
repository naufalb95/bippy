import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../theme';

type Props = { onRequest: () => void };

export function PermissionGate({ onRequest }: Props) {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Camera permission needed</Text>
      <Text style={styles.subtitle}>
        We need the camera to scan barcodes and QR codes.
      </Text>
      <Pressable style={styles.button} onPress={onRequest}>
        <Text style={styles.buttonText}>Allow camera</Text>
      </Pressable>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.bgLight,
  },
  title: {
    color: COLORS.textOnLight,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textOnLightSoft,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.textOnLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
