import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Gentle, tasteful up/down bob - the prototype's `pxfloat` (translateY -7px).
// `duration` is the FULL cycle (down + back up), matching the design's
// `animation: pxfloat 4s` semantics so call sites pass the design's seconds.
// Wrap a mascot / hero element to make it drift.
export function Float({
  children,
  distance = 7,
  duration = 4000,
  style,
}: {
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const ty = useSharedValue(0);

  useEffect(() => {
    const leg = duration / 2;
    ty.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration: leg, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: leg, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [ty, distance, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
