import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface ChipProps {
  children: React.ReactNode;
  you?: boolean;
  soft?: boolean;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function Chip({ children, you = false, soft = false, selected, onPress, accessibilityLabel }: ChipProps) {
  const color = you ? colors.p1Deep : colors.p2Deep;
  const bgColor = soft
    ? you
      ? 'rgba(255,142,122,0.14)'
      : 'rgba(157,149,245,0.16)'
    : color;
  const textColor = soft ? color : '#fff';

  const isInteractive = typeof onPress === 'function' || selected !== undefined;

  return (
    <View
      accessible={isInteractive}
      accessibilityRole={isInteractive ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.pill,
        backgroundColor: bgColor,
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 13.5,
          fontWeight: '600',
          lineHeight: 17,
          color: textColor,
          fontFamily: fontFamily.ui,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
