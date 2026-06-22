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

// Gentle, tasteful up/down bob - the prototype's `pxfloat` (translateY -7px, ~5s loop).
// Wrap a mascot / hero element to make it drift.
export function Float({
  children,
  distance = 7,
  duration = 2600,
  style,
}: {
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
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
