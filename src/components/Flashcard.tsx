import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useVideoPlayer,
  VideoView,
  type VideoPlayerStatus,
} from 'expo-video';
import type { Flashcard as FlashcardType } from '../flashcards';
import { resolveVideoSource } from '../videoCache';
import { COLORS } from '../theme';

type Props = {
  card: FlashcardType;
  onDismiss: () => void;
};

export function Flashcard({ card, onDismiss }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.bg]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.videoArea}>
          {card.video !== undefined ? (
            <VideoBlock source={card.video} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Video coming soon!</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSection}>
          <Text style={styles.name}>{card.name}</Text>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Scan again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <StatusBar style="dark" />
    </View>
  );
}

function VideoBlock({ source }: { source: number | string }) {
  // Stable across renders for the same input — keeps useVideoPlayer from
  // recreating the player. Hits the cache synchronously: cached URLs
  // return a local file URI; uncached return the URL itself for
  // streaming while a background download warms the cache.
  const resolved = useMemo(() => resolveVideoSource(source), [source]);

  const player = useVideoPlayer(resolved, (p) => {
    p.loop = true;
    p.muted = false;
    p.audioMixingMode = 'mixWithOthers';
  });

  const [status, setStatus] = useState<VideoPlayerStatus>(player.status);

  useEffect(() => {
    player.loop = true;
    setStatus(player.status);
    if (player.status === 'readyToPlay') player.play();

    const statusSub = player.addListener('statusChange', ({ status }) => {
      setStatus(status);
      if (status === 'readyToPlay') {
        player.loop = true;
        player.play();
      }
    });

    // Manual loop fallback in case the loop flag is dropped for file://
    // sources (intermittent in this expo-video version).
    const endSub = player.addListener('playToEnd', () => {
      player.currentTime = 0;
      player.play();
    });

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player]);

  const showSpinner = status !== 'readyToPlay';

  return (
    <View style={styles.video}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {showSpinner && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size="large" color={COLORS.brandLight} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#F5EBD9',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 12,
    paddingTop: 8,
  },
  name: {
    color: COLORS.textOnLight,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: COLORS.placeholderBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    color: COLORS.textOnLightSoft,
    fontSize: 18,
    fontStyle: 'italic',
  },
  video: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#1c140e',
    overflow: 'hidden',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,20,14,0.35)',
  },
  button: {
    backgroundColor: COLORS.brandDeep,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    color: COLORS.textOnDark,
    fontSize: 18,
    fontWeight: '700',
  },
});
