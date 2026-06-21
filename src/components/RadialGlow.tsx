import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// RN has no radial-gradient; an SVG radial fading to transparent stands in for
// the prototype's radial-gradient(...) sheens and glows (same trick as DawnBlobs).
export function RadialGlow({
  color = '#FF8E7A',
  opacity = 0.32,
  cx = '50%',
  cy = '50%',
  r = '65%',
  stop = 0.65,
  style,
}: {
  color?: string;
  opacity?: number;
  cx?: string;
  cy?: string;
  r?: string;
  stop?: number;
  style?: ViewStyle;
}) {
  const gid = `glow-${color}-${opacity}-${cx}-${cy}-${r}`.replace(/[^a-z0-9-]/gi, '');
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Defs>
        <RadialGradient id={gid} cx={cx} cy={cy} r={r}>
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset={String(stop)} stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
    </Svg>
  );
}

export default RadialGlow;
