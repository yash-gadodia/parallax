import React from 'react';
import { Pressable, PressableProps, ViewStyle, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressProps extends Omit<PressableProps, 'style'> {
  onPress?: () => void;
  disabled?: boolean;
  scale?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: PressableProps['accessibilityRole'];
  accessibilityState?: PressableProps['accessibilityState'];
}

export default function Press({
  onPress,
  disabled = false,
  scale = true,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
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

  // style (incl. flex:1 for tab items) and the scale transform must live on the
  // same element - the touch target - or flex never reaches the flexing element.
  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole ?? (onPress ? 'button' : undefined)}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={[style, { transform: [{ scale: scaleValue }] }]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
