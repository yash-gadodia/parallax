import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../design/tokens';

interface RingProps {
  pct: number;
  size?: number;
  animate?: boolean;
}

let AnimatedCircle: any;
try {
  AnimatedCircle = Animated.createAnimatedComponent(Circle);
} catch {
  AnimatedCircle = Circle;
}

export function Ring({ pct, size = 168, animate = true }: RingProps) {
  const r = (size - 18) / 2;
  const c = 2 * Math.PI * r;
  const targetOffset = c * (1 - pct / 100);
  const offsetValue = useSharedValue(animate ? c : targetOffset);

  useEffect(() => {
    if (animate) {
      offsetValue.value = withTiming(targetOffset, {
        duration: 1100,
        easing: Easing.bezier(0.3, 0.9, 0.3, 1),
      });
    }
  }, [pct, animate, targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offsetValue.value,
  }));

  return (
    <View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="usg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF8E7A" />
            <Stop offset="100%" stopColor="#9D95F5" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.sunken}
          strokeWidth={14}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#usg)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}
