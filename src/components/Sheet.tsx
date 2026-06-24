import React, { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, shadows, space } from '../design/tokens';
import { kickStyle } from '../design/typography';

interface SheetProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function Sheet({ title, onClose, children }: SheetProps) {
  const translateY = useSharedValue(100);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 340,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${translateY.value}%` }],
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <Pressable
        testID="sheet-backdrop"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(40,28,50,0.4)',
        }}
      >
        <BlurView intensity={2} style={{ flex: 1 }} />
      </Pressable>

      <AnimatedView style={[{ position: 'relative' }, animatedStyle]}>
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: space.gutter,
              paddingTop: 12,
              paddingBottom: 26,
            },
            shadows.shadowPop,
          ]}
        >
          <View
            style={{
              width: 40,
              height: 4.5,
              borderRadius: 3,
              backgroundColor: colors.sunken,
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 16,
            }}
          />
          {title && (
            <Text
              style={[
                kickStyle,
                {
                  textAlign: 'center',
                  marginBottom: 14,
                },
              ]}
            >
              {title}
            </Text>
          )}
          {children}
        </View>
      </AnimatedView>
    </View>
  );
}
