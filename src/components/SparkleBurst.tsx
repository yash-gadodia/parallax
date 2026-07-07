import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../design/tokens';

function SparkleParticle({
  angle,
  dist,
  emoji,
  delay,
}: {
  angle: number;
  dist: number;
  emoji: string;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value },
      { scale: 0.5 + 0.6 * t.value },
    ],
    opacity: t.value < 0.65 ? 1 : Math.max(0, 1 - (t.value - 0.65) / 0.35),
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <Text allowFontScaling={false} style={{ fontSize: 15, color: colors.ink }}>
        {emoji}
      </Text>
    </Animated.View>
  );
}

/**
 * One-shot gentle sparkle burst — ~12 emoji particles drifting outward from
 * the center, fading as they go. Skipped entirely when the user prefers
 * reduced motion. Shared by the reveal (>=70 wave), the milestone screen,
 * and the mutual-repair reveal (V2 F2).
 */
export function SparkleBurst({
  count = 12,
  radius: burstRadius = 96,
  emojis = ['✨', '💫', '⭐️'],
  delay = 0,
  style,
}: {
  count?: number;
  radius?: number;
  emojis?: string[];
  delay?: number;
  style?: ViewStyle;
}) {
  const [motionOk, setMotionOk] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (alive && !reduced) setMotionOk(true);
      })
      .catch(() => {
        if (alive) setMotionOk(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!motionOk) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {Array.from({ length: count }, (_, i) => (
        <SparkleParticle
          key={i}
          angle={(i / count) * Math.PI * 2}
          dist={burstRadius * (i % 2 === 0 ? 1 : 0.72)}
          emoji={emojis[i % emojis.length]}
          delay={delay + i * 36}
        />
      ))}
    </View>
  );
}
