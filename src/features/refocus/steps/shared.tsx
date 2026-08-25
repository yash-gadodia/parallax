import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Tok from '../../../components/Tok';
import { Icon, ICONS } from '../../../components/Icon';
import Card from '../../../components/Card';
import { colors, radius, shadows } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';

// Identity definitions
export const YOU = { name: 'you', initial: 'Y' };

export function SideInRow({ label, you = false, who }: { label: string; you?: boolean; who?: { name: string; initial: string } }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        ...shadows.shadowSoft,
      }}
    >
      <Tok who={who ?? YOU} you={you} size={28} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: colors.ink,
          textAlign: 'left',
          fontFamily: fontFamily.ui,
        }}
      >
        {label}
      </Text>
      <Icon d={ICONS.check} size={16} color={colors.matchDeep} sw={2.6} />
    </View>
  );
}

export function PulseDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 1000,
        easing: Easing.ease,
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: radius.pill,
          backgroundColor: colors.p2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ResultSection({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      style={{
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginTop: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 17, color: colors.ink }}>{icon}</Text>
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10.5,
            letterSpacing: 0.14 * 10.5,
            textTransform: 'uppercase',
            color: colors.inkSoft,
          }}
        >
          {label}
        </Text>
      </View>
      {children}
    </Card>
  );
}

export function NeedCard({
  who,
  youSide = false,
  text,
}: {
  who: { name: string; initial: string };
  youSide?: boolean;
  text: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <Tok who={who} you={youSide} size={26} />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: colors.ink,
          lineHeight: 14 * 1.4,
          fontFamily: fontFamily.ui,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
