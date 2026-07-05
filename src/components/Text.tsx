import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors } from '../design/tokens';
import { fontFamily, serifStyle } from '../design/typography';

interface KickProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  c?: string;
  style?: TextProps['style'];
}

interface SerifProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  s?: number;
  italic?: boolean;
  c?: string;
  style?: TextProps['style'];
}

export function Kick({
  children,
  c = colors.inkMute,
  style,
  ...props
}: KickProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: fontFamily.mono,
          fontSize: 10,
          lineHeight: 12,
          includeFontPadding: false,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: c,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Serif({
  children,
  s = 34,
  italic = false,
  c = colors.ink,
  style,
  ...props
}: SerifProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontFamily: fontFamily.disp,
          fontSize: s,
          lineHeight: s * 1.3,
          includeFontPadding: false,
          fontStyle: italic ? 'italic' : 'normal',
          color: c,
          letterSpacing: 0.005,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
