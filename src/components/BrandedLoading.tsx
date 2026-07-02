import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DawnBlobs } from './DawnBlobs';
import { Mark } from './Mark';
import { gradients } from '../design/tokens';

// The cold-start frame: the dawn backdrop every screen shares, with the brand
// mark gently pulsing (the Float idiom, applied to opacity/scale). Deliberately
// font-free - it renders while the custom fonts are still loading, so it can't
// use <Text>/Wordmark; the Mark glyph is pure SVG. Both startup phases (fonts,
// then the couple lookup) render this identical frame, so launch reads as one
// continuous branded moment instead of two blank white flashes.
export function BrandedLoading() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + pulse.value * 0.28,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));

  return (
    <LinearGradient
      testID="branded-loading"
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={pulseStyle}>
          <Mark size={64} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
