import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors, radius, shadows } from '../design/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ children, style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.card,
          ...(shadows.shadow as any),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
