import React from 'react';
import { Text, TextProps, ColorValue } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../design/tokens';

interface GradientTextProps extends TextProps {
  children: string;
  gradient?: readonly [ColorValue, ...ColorValue[]];
}

export default function GradientText({
  children,
  style,
  gradient,
  ...props
}: GradientTextProps) {
  const colors = (gradient ?? gradients.us.colors) as readonly [ColorValue, ColorValue, ...ColorValue[]];
  const locations = (gradients.us.locations as unknown) as readonly [number, number, ...number[]];

  return (
    <MaskedView
      maskElement={
        <Text style={style} allowFontScaling={false}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={locations}
      >
        <Text style={[style, { opacity: 0 }]} allowFontScaling={false} {...props}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
