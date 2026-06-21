import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { colors } from '../design/tokens';

export interface PeekProps {
  size?: number;
  mood?: 'happy' | 'focus' | 'search' | 'love';
}

export function Peek({ size = 88, mood = 'happy' }: PeekProps) {
  const focus = mood === 'focus';
  const love = mood === 'love';
  const search = mood === 'search';
  const inward = !(focus || love);

  // Pupil x-positions based on mood
  const lpx = inward ? 30 : 28;
  const rpx = inward ? 50 : 52;

  const height = size * 0.7;

  const Eye = ({ ex, px }: { ex: number; px: number }) => {
    if (love) {
      // Love mood: arc instead of eye
      return (
        <Path
          d={`M${ex - 6} 25 q6 -6.5 12 0`}
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    // Non-love moods: eye with pupil
    return (
      <G>
        {/* Outer eye white */}
        <Ellipse cx={ex} cy={26} rx={7.6} ry={8.6} fill="#fff" />

        {/* Pupil + shine */}
        <Circle cx={px} cy={27} r={3.7} fill={colors.ink} />
        <Circle cx={px + 1.4} cy={25.5} r={1.3} fill="#fff" />
      </G>
    );
  };

  return (
    <View>
      <Svg
        width={size}
        height={height}
        viewBox="0 0 80 56"
        fill="none"
        style={{ overflow: 'visible' }}
      >
        {/* Lens circles: coral + periwinkle */}
        <Circle cx={28} cy={28} r={20} fill={colors.p1} fillOpacity={0.92} />
        <Circle cx={52} cy={28} r={20} fill={colors.p2} fillOpacity={0.8} />

        {/* Eyes or love arcs */}
        <Eye ex={28} px={lpx} />
        <Eye ex={52} px={rpx} />

        {/* Cheek dots (love and focus moods) */}
        {(love || focus) && (
          <>
            <Circle cx={19} cy={34} r={3.2} fill={colors.p1} fillOpacity={0.45} />
            <Circle cx={61} cy={34} r={3.2} fill={colors.p2} fillOpacity={0.45} />
          </>
        )}

        {/* Mouth (mood-dependent path) */}
        <Path
          d={
            focus || love
              ? 'M33 39 q7 7.5 14 0'
              : search
                ? 'M37 40 q3 3 6 0'
                : 'M35 39 q5 4.5 10 0'
          }
          stroke={colors.ink}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />

        {/* Focus sparkle */}
        {focus && (
          <Path
            d="M65 12 l1.5 3.6 3.6 1.5 -3.6 1.5 -1.5 3.6 -1.5 -3.6 -3.6 -1.5 3.6 -1.5z"
            fill={colors.p2Deep}
          />
        )}
      </Svg>
    </View>
  );
}
