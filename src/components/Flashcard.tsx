import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Flashcard as FlashcardType } from '../flashcards';
import { useCachedVideoSource } from '../hooks/useCachedVideoSource';
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
            <VideoArea source={card.video} />
          ) : (
            <PlaceholderPanel text="Video coming soon!" />
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

function VideoArea({ source }: { source: number | string }) {
  const state = useCachedVideoSource(source);

  if (state.status === 'loading') {
    return (
      <PlaceholderPanel>
        <ActivityIndicator size="large" color={COLORS.brandDeep} />
        <Text style={styles.loadingText}>Loading…</Text>
      </PlaceholderPanel>
    );
  }

  if (state.status === 'error') {
    return <PlaceholderPanel text="Couldn't load the video." />;
  }

  return <VideoBlock source={state.source} />;
}

function PlaceholderPanel({
  text,
  children,
}: {
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.placeholder}>
      {children}
      {text && <Text style={styles.placeholderText}>{text}</Text>}
    </View>
  );
}

function VideoBlock({ source }: { source: number | string }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = false;
    // Coexist with the beep player's audio session instead of fighting it.
    p.audioMixingMode = 'mixWithOthers';
  });

  // Setup-callback play() fires before the source is ready and silently
  // no-ops. Start playback when the player actually reaches readyToPlay.
  useEffect(() => {
    if (player.status === 'readyToPlay') {
      player.play();
    }
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        player.play();
      }
    });
    return () => sub.remove();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls={false}
    />
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
  loadingText: {
    color: COLORS.textOnLightSoft,
    fontSize: 16,
    fontWeight: '600',
  },
  video: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#1c140e',
    overflow: 'hidden',
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
