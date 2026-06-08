import { useCallback, useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

export function useScannerBeep() {
  const player = useAudioPlayer(require('../../assets/beep.wav'));

  // Without this the beep is silent when the phone is on silent —
  // defeating the cashier-toy point of the app.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  return useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }, [player]);
}
