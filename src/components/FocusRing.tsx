import { Animated, StyleSheet } from 'react-native';
import { FOCUS_RING_SIZE } from '../constants';
import type { FocusPoint } from '../hooks/useTapFocus';

type Props = {
  point: FocusPoint;
  anim: Animated.Value;
};

export function FocusRing({ point, anim }: Props) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: point.x - FOCUS_RING_SIZE / 2,
          top: point.y - FOCUS_RING_SIZE / 2,
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1.4, 1],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
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
});
