import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { colors, gradients } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import { Float } from '../src/components/Float';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { Icon, ICONS } from '../src/components/Icon';
import { SparkleBurst } from './reveal';
import * as haptics from '../src/lib/haptics';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

export default function MilestoneScreen() {
  const router = useRouter();
  const { days: daysParam } = useLocalSearchParams<{ days?: string }>();
  // Real milestones come from the server (0017): 3/7/14/30/50/100. A missing
  // or bad param falls back to the SMALLEST milestone — never fabricate a
  // bigger streak than was earned.
  const parsed = Number.parseInt(daysParam ?? '', 10);
  const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 3;

  // Milestone-specific copy — one honest line per real threshold (0017:
  // 3/7/14/30/50/100), plus 365 for the long game. No fabricated default.
  const line =
    days >= 365
      ? 'A year of choosing\neach other.'
      : days >= 100
        ? 'A hundred days of\nshowing up.'
        : days >= 50
          ? 'Fifty days of\nshowing up together.'
          : days >= 30
            ? "You're officially\na streak couple."
            : days >= 14
              ? 'Two weeks,\nzero blinks.'
              : days >= 7
                ? 'One week strong.'
                : 'Three days in.\nThis is becoming a thing.';

  const sub =
    days >= 365
      ? '365 tiny moments of showing up. That\'s a love story.'
      : days >= 100
        ? 'A hundred days of showing up. Rarer than it sounds.'
        : days >= 50
          ? 'Fifty days straight. You\'ve made this a habit, together.'
          : days >= 30
            ? 'A whole month of showing up for each other. That\'s rarer than you think.'
            : days >= 14
              ? 'Fourteen days without missing once. You two mean it.'
              : days >= 7
                ? 'Seven days in a row. This is how rituals are born.'
                : 'Three days in a row. Every ritual starts exactly like this.';

  // Celebration haptic at the earned peak — once, on mount.
  useEffect(() => {
    haptics.celebration();
  }, []);

  const handleBack = () => {
    safeBack(router);
  };

  const handleShare = () => {
    router.push('/(sheets)/share');
  };

  const width = useWindowDimensions().width;

  return (
    <LinearGradient
      colors={gradients.us.colors}
      locations={gradients.us.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, position: 'relative' }}
    >
      {/* Radial gradient overlay at top (light center) - not available in RN, skipped */}

      {/* Close button (X) */}
      <View
        style={{
          position: 'absolute',
          top: 52,
          right: 16,
          zIndex: 30,
        }}
      >
        <Press onPress={handleBack} scale={false} style={{ width: 'auto' }}>
          <View
            style={{
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon d={ICONS.close} size={17} color="#fff" sw={2} />
          </View>
        </Press>
      </View>

      {/* DawnBlobs background */}
      <DawnBlobs />

      {/* Content centered */}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingVertical: 48,
          }}
          scrollEnabled={false}
        >
          {/* Floating flame and days number */}
          <View style={{ position: 'relative', zIndex: 10, alignItems: 'center' }}>
            {/* Floating flame container */}
            <Float distance={7} duration={3500}>
              <View
                style={{
                  position: 'relative',
                  width: 140,
                  height: 140,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Soft circular halo behind flame */}
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                  }}
                />
                {/* Flame emoji */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 72,
                    color: '#fff',
                  }}
                >
                  🔥
                </Text>
                {/* One-shot celebration sparkle (reduced-motion aware) */}
                <SparkleBurst
                  emojis={['🔥', '✨', '💞', '🎉', '💗']}
                  radius={150}
                  delay={250}
                />
              </View>
            </Float>

            {/* Big serif days number */}
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.disp,
                fontSize: 92,
                color: '#fff',
                lineHeight: 92,
                marginTop: 8,
              }}
            >
              {days}
            </Text>

            {/* Subheader: "days in a row, together" */}
            <Kick c="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>
              days in a row, together
            </Kick>

            {/* Main milestone message */}
            <Serif
              s={40}
              italic
              c="#fff"
              style={{
                marginTop: 16,
                lineHeight: 44,
                textAlign: 'center',
              }}
            >
              {line}
            </Serif>

            {/* Descriptive text */}
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 22,
                marginTop: 12,
                maxWidth: 290,
                textAlign: 'center',
                fontFamily: fontFamily.ui,
              }}
            >
              {sub}
            </Text>

            {/* Avatar tokens (you + partner overlapping) */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 18,
              }}
            >
              <Tok who={YOU} you size={40} ring />
              <View style={{ marginLeft: -18 }}>
                <Tok who={PAR} size={40} ring />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom buttons: Share + Keep going */}
      <View
        style={{
          position: 'absolute',
          bottom: 30,
          left: 28,
          right: 28,
          zIndex: 10,
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Btn kind="soft" onPress={handleShare} sub="show it off">
          Share our milestone
        </Btn>
        <Press onPress={handleBack}>
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                paddingVertical: 10,
                fontSize: 14,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.92)',
                fontFamily: fontFamily.ui,
              }}
            >
              Keep it going
            </Text>
          </View>
        </Press>
      </View>
    </LinearGradient>
  );
}
