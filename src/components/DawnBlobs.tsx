import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

// The prototype's "dawn" depth: two soft, blurred color blobs floating behind
// the content — coral top-left, periwinkle mid-right. (couples-core Phone shell.)
// SVG radial gradients fading to transparent stand in for the CSS blur.
export function DawnBlobs() {
  const { width } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="dawnCoral" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FF8E7A" stopOpacity={0.34} />
          <Stop offset="0.7" stopColor="#FF8E7A" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="dawnPeri" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#9D95F5" stopOpacity={0.3} />
          <Stop offset="0.7" stopColor="#9D95F5" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={60} cy={40} r={150} fill="url(#dawnCoral)" />
      <Circle cx={width - 40} cy={230} r={160} fill="url(#dawnPeri)" />
    </Svg>
  );
}
