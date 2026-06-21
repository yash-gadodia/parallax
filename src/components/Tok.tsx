import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius, shadows } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface Who {
  initial: string;
}

interface TokProps {
  who: Who;
  size?: number;
  ring?: boolean;
  you?: boolean;
}

export default function Tok({
  who,
  size = 30,
  ring = false,
  you = false,
}: TokProps) {
  const bgColor = you ? colors.p1 : colors.p2;
  const ringBorderWidth = ring ? 3 : 0;

  return (
    <View
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
          lineHeight: size * 0.5,
          textAlign: 'center',
        }}
      >
        {who.initial}
      </Text>
    </View>
  );
}
