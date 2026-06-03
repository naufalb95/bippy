import { StyleSheet, Text, View } from 'react-native';

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
      <Text style={styles.footerHint}>Tap anywhere to focus</Text>
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
});
