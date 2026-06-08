import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>Point at a barcode</Text>
    </View>
  );
}

export function Reticle() {
  return (
    <View style={styles.reticleWrap} pointerEvents="none">
      <View style={styles.reticle} />
    </View>
  );
}

export function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Hold steady — it'll beep when it sees one.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  headerText: {
    color: COLORS.textOnDark,
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: COLORS.shadow,
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
    borderColor: COLORS.brand,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textOnDark,
    fontSize: 14,
    opacity: 0.85,
    textShadowColor: COLORS.shadow,
    textShadowRadius: 4,
  },
});
