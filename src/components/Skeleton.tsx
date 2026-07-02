import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '../design/tokens';

// The loading-placeholder atom: a soft block in the sunken surface tone that
// gently pulses (the BrandedLoading idiom applied to layout-shaped chunks), so
// async content areas breathe while they load instead of popping in from blank.
export function Skeleton({
  h,
  w = '100%',
  br = radius.tile,
  style,
  testID = 'skeleton',
}: {
  h: number;
  w?: DimensionValue;
  br?: number;
  style?: ViewStyle;
  testID?: string;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.3,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          height: h,
          width: w,
          borderRadius: br,
          backgroundColor: colors.sunken,
        },
        pulseStyle,
        style,
      ]}
    />
  );
}
