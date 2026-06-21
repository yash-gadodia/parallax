import React, { useState } from 'react';
import {
  Pressable,
  PressableProps,
  ViewStyle,
  Animated,
  View,
} from 'react-native';

interface PressProps extends Omit<PressableProps, 'style'> {
  onPress?: () => void;
  disabled?: boolean;
  scale?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export default function Press({
  onPress,
  disabled = false,
  scale = true,
  style,
  children,
  ...props
}: PressProps) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && scale) {
      Animated.timing(scaleValue, {
        toValue: 0.975,
        duration: 140,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (scale) {
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
