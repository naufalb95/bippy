import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, type GestureResponderEvent } from 'react-native';
import type { FocusMode } from 'expo-camera';
import { REFOCUS_TOGGLE_MS } from '../constants';

export type FocusPoint = { x: number; y: number };

export function useTapFocus() {
  // 'off' = continuous autofocus; flipping to 'on' briefly forces a refocus.
  const [autofocus, setAutofocus] = useState<FocusMode>('off');
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const refocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (refocusTimer.current) clearTimeout(refocusTimer.current);
    },
    [],
  );

  const handleTap = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      setFocusPoint({ x: locationX, y: locationY });

      setAutofocus('on');
      if (refocusTimer.current) clearTimeout(refocusTimer.current);
      refocusTimer.current = setTimeout(
        () => setAutofocus('off'),
        REFOCUS_TOGGLE_MS,
      );

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

  return { autofocus, focusPoint, focusAnim, handleTap };
}
