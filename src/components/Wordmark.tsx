import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface SlashesProps {
  h?: number;
  offset?: boolean;
  light?: boolean;
}

interface WordmarkProps {
  size?: number;
  c?: string;
  offset?: boolean;
  light?: boolean;
}

export function Slashes({ h = 25, offset = false, light = false }: SlashesProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(offset ? -(h * 0.13) : 0, {
      duration: 550,
      easing: Easing.bezier(0.3, 0.9, 0.3, 1),
    });
  }, [offset, h, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const barWidth = h * 0.1;
  const barHeight = h * 0.7;
  const borderRadius = h * 0.05;
  const marginLeft = h * 0.08;

  const bar1Color = light ? '#fff' : colors.p1;
  const bar2Color = light ? 'rgba(255,255,255,0.82)' : colors.p2;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: h * 0.04, marginBottom: h * 0.22 }}>
      <View
        style={{
          width: barWidth,
          height: barHeight,
          borderRadius,
          backgroundColor: bar1Color,
          transform: [{ skewX: '-11deg' }],
        }}
      />
      <Animated.View
        style={[
          {
            width: barWidth,
            height: barHeight,
            borderRadius,
            backgroundColor: bar2Color,
            marginLeft,
            transform: [{ skewX: '-11deg' }],
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function Wordmark({
  size = 25,
  c = colors.ink,
  offset = false,
  light = false,
}: WordmarkProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text
        style={{
          fontFamily: fontFamily.disp,
          fontSize: size,
          color: light ? '#fff' : c,
          letterSpacing: 0.25,
          lineHeight: size,
        }}
      >
        para
      </Text>
      <Slashes h={size} offset={offset} light={light} />
      <Text
        style={{
          fontFamily: fontFamily.disp,
          fontSize: size,
          color: light ? '#fff' : c,
          letterSpacing: 0.25,
          lineHeight: size,
        }}
      >
        ax
      </Text>
    </View>
  );
}
