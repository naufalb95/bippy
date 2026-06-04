import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Flashcard as FlashcardType } from '../flashcards';
import { COLORS } from '../theme';

type Props = {
  card: FlashcardType;
  onDismiss: () => void;
};

export function Flashcard({ card, onDismiss }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={100}
        tint="dark"
      />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.name}>{card.name}</Text>
          {card.video !== undefined ? (
            <VideoBlock source={card.video} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Video coming soon!</Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Scan again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function VideoBlock({ source }: { source: number | string }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrim: {
    backgroundColor: COLORS.scrim,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  name: {
    color: COLORS.brandLight,
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: COLORS.shadow,
    textShadowRadius: 6,
  },
  placeholder: {
    width: '90%',
    aspectRatio: 4 / 3,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.textOnDarkSoft,
    fontSize: 18,
    fontStyle: 'italic',
  },
  video: {
    width: '92%',
    aspectRatio: 4 / 3,
    borderRadius: 24,
    backgroundColor: '#1c140e',
    overflow: 'hidden',
  },
  footer: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    color: COLORS.textOnLight,
    fontSize: 18,
    fontWeight: '700',
  },
});
