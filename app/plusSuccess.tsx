import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Btn from '../src/components/Btn';
import { DawnBlobs } from '../src/components/DawnBlobs';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

interface Confetti {
  id: number;
  x: number;
  delay: number;
  emoji: string;
}

export default function PlusSuccessScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const hearts = useMemo<Confetti[]>(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 6 + Math.random() * 88,
        delay: Math.random() * 0.7,
        emoji: ['💞', '💗', '🫶', '✨', '🎉'][i % 5],
      })),
    []
  );

  // Circular check badge animation
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.8);

  useEffect(() => {
    checkOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    checkScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const handleExplore = () => {
    router.push('/packs');
  };

  const handleBackToday = () => {
    router.push('/(tabs)/today');
  };

  return (
    <LinearGradient
      colors={gradients.us.colors}
      locations={gradients.us.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingTop: 48,
            overflow: 'hidden',
          }}
        >
          {/* Confetti hearts floating up */}
          {hearts.map((h) => (
            <ConfettiHeart key={h.id} heart={h} screenWidth={width} />
          ))}

          {/* Circular check badge */}
          <Animated.View
            style={[
              {
                width: 110,
                height: 110,
                borderRadius: 999,
                backgroundColor: colors.p2,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                ...{
                  shadowColor: 'rgba(112,100,230,0.3)',
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 1,
                  shadowRadius: 40,
                  elevation: 16,
                },
              },
              checkAnimatedStyle,
            ]}
          >
            <Icon
              d={ICONS.check}
              size={52}
              color="#fff"
              sw={2.4}
            />
          </Animated.View>

          {/* Welcome to plus */}
          <Kick c={colors.p2Deep} style={{ marginTop: 16, marginBottom: 0 }}>
            welcome to plus
          </Kick>

          {/* Main heading */}
          <Serif
            s={42}
            italic
            c={colors.ink}
            style={{
              marginTop: 8,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            You're both in 💞
          </Serif>

          {/* Copy text */}
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15.5,
              lineHeight: 15.5 * 1.55,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 290,
              fontFamily: fontFamily.ui,
            }}
          >
            Every pack is unlocked, drops are unlimited, and your full history
            is saved, for you and Dani.
          </Text>

          {/* Action buttons */}
          <View style={{ marginTop: 30, width: '100%', gap: space.gap }}>
            <Btn kind="us" onPress={handleExplore} sub="all 4 packs unlocked">
              Explore the packs
            </Btn>

            <Press
              onPress={handleBackToday}
              scale={false}
              style={{ width: '100%' }}
            >
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 10,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.inkMute,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Back to today
                </Text>
              </View>
            </Press>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Confetti heart animation
function ConfettiHeart({
  heart,
  screenWidth,
}: {
  heart: Confetti;
  screenWidth: number;
}) {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withTiming(-200, {
      duration: 1800,
      easing: Easing.out(Easing.ease),
    });
  }, [ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: 120,
          left: `${heart.x}%`,
          opacity: 0.9,
        },
        animatedStyle,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 24,
          color: colors.ink,
        }}
      >
        {heart.emoji}
      </Text>
    </Animated.View>
  );
}
