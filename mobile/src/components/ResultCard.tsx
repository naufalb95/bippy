import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Scan } from '../hooks/useBarcodeScan';
import { COLORS } from '../theme';

type Props = {
  scan: Scan;
  onDismiss: () => void;
};

export function ResultCard({ scan, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{formatType(scan.type)}</Text>
      <Text style={styles.text} numberOfLines={4} adjustsFontSizeToFit>
        {scan.data}
      </Text>
      <Pressable style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>Scan again</Text>
      </Pressable>
    </View>
  );
}

function formatType(type: string | undefined): string {
  if (!type) return 'Code';
  return String(type).replace(/[_-]/g, ' ').toUpperCase();
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    gap: 14,
    alignItems: 'center',
  },
  label: {
    color: COLORS.accentLabel,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  text: {
    color: COLORS.textOnDark,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
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
