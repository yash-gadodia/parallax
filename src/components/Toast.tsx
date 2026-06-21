import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, shadows, radius } from '../design/tokens';

interface ToastProps {
  msg: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function Toast({ msg }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.ease,
    });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.ease,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 96,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <AnimatedView
        style={[
          {
            backgroundColor: colors.ink,
            paddingHorizontal: 18,
            paddingVertical: 11,
            borderRadius: radius.pill,
            maxWidth: '80%',
          },
          shadows.shadow,
          animatedStyle,
        ]}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 13.5,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {msg}
        </Text>
      </AnimatedView>
    </View>
  );
}
