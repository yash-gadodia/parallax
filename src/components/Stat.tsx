import React from 'react';
import { View, Text } from 'react-native';
import GradientText from './GradientText';
import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';

interface StatProps {
  big: string;
  label: string;
  grad?: boolean;
}

export default function Stat({ big, label, grad = false }: StatProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {grad ? (
        <GradientText
          style={{
            fontSize: 30,
            fontFamily: fontFamily.disp,
            fontWeight: '400',
            lineHeight: 30,
            textAlign: 'center',
          }}
        >
          {big}
        </GradientText>
      ) : (
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 30,
            fontFamily: fontFamily.disp,
            fontWeight: '400',
            color: colors.ink,
            lineHeight: 30,
            textAlign: 'center',
          }}
        >
          {big}
        </Text>
      )}
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 9,
          fontFamily: fontFamily.mono,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.inkMute,
          marginTop: 6,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
