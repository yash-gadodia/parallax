import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius, shadows } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface Who {
  initial: string;
  name?: string;
}

interface TokProps {
  who: Who;
  size?: number;
  ring?: boolean;
  you?: boolean;
  decorative?: boolean;
}

export default function Tok({
  who,
  size = 30,
  ring = false,
  you = false,
  decorative = false,
}: TokProps) {
  const bgColor = you ? colors.p1 : colors.p2;
  const ringBorderWidth = ring ? 3 : 0;
  const label = who.name ? `${who.name}'s avatar` : who.initial;

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : label}
      importantForAccessibility={decorative ? 'no-hide-descendants' : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...(ring && {
          borderWidth: ringBorderWidth,
          borderColor: colors.surface,
          ...shadows.shadow,
        }),
        ...(!ring && shadows.shadowSoft),
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: size * 0.5,
          fontFamily: fontFamily.disp,
          color: '#fff',
          fontWeight: '400',
          lineHeight: size * 0.625,
          includeFontPadding: false,
          textAlign: 'center',
        }}
      >
        {who.initial}
      </Text>
    </View>
  );
}
