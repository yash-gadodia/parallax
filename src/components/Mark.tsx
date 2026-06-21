import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../design/tokens';

interface MarkProps {
  size?: number;
}

export function Mark({ size = 26 }: MarkProps) {
  const height = size * 0.74;

  return (
    <View>
      <Svg width={size} height={height} viewBox="0 0 34 25" fill="none">
        <Circle cx="13" cy="12.5" r="9.2" fill={colors.p1} fillOpacity={0.92} />
        <Circle cx="21" cy="12.5" r="9.2" fill={colors.p2} fillOpacity={0.78} />
      </Svg>
    </View>
  );
}
