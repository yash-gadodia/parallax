import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import { Kick, Serif } from '../src/components/Text';
import GradientText from '../src/components/GradientText';
import { Float } from '../src/components/Float';
import Tok from '../src/components/Tok';
import { Icon, ICONS } from '../src/components/Icon';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Toast from '../src/components/Toast';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { MILES } from '../src/content/us';
import { useCouple } from '../src/features/pairing/useCouple';

// Mock partner data
const YOU = { initial: 'Y' };
const PARTNER = { initial: 'D' };

export default function StreakScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [frozen, setFrozen] = useState(false);
  const [showToast, setShowToast] = useState('');
  const { couple } = useCouple();

  const streak = couple?.streak ?? 23;
  const week = [true, true, true, true, true, true, false]; // M-S, today not yet
  const next = MILES.find((m) => m > streak) || 365;
  const prevM = [0, ...MILES].reverse().find((m) => m <= streak) || 0;
  const prog = Math.min(1, (streak - prevM) / (next - prevM));

  const handleBack = () => router.back();

  const handleFreezePress = () => {
    if (!frozen) {
      setFrozen(true);
      setShowToast('Freeze armed 🧊 you\'re covered');
      setTimeout(() => setShowToast(''), 2500);
    }
  };

  const handleMilestonePress = (days: number) => {
    const hit = streak >= days;
    const isNext = days === next;
    if (hit || isNext) {
      router.push(`/milestone?days=${days}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      {/* Background: dawn gradient + blobs */}
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <DawnBlobs />

      {/* TopBar */}
      <TopBar title="your streak" onBack={handleBack} />

      {/* ScrollView content */}
      <ScrollView
        contentContainerStyle={{
          paddingTop: 72,
          paddingBottom: 100,
          paddingHorizontal: space.gutter,
        }}
        scrollEventThrottle={16}
      >
        {/* Hero flame + streak number */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {/* Flame with glow */}
          <Float distance={7} duration={2600}>
            <View
              style={{
                position: 'relative',
                width: 150,
                height: 150,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Radial glow background */}
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 75,
                  backgroundColor: 'rgba(255,142,122,0.32)',
                }}
              />
              <Text style={{ fontSize: 72 }}>🔥</Text>
            </View>
          </Float>

          {/* Streak number in gradient */}
          <View style={{ marginTop: 4 }}>
            <GradientText
              style={{
                fontFamily: fontFamily.disp,
                fontSize: 66,
                lineHeight: 66,
                letterSpacing: -0.015,
              }}
            >
              {String(streak)}
            </GradientText>
          </View>

          {/* "day shared streak" */}
          <Kick style={{ marginTop: 6 }}>day shared streak</Kick>

          {/* Both faces */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 14,
            alignItems: 'center',
          }}>
            <Tok who={YOU} you size={34} ring />
            <View style={{ marginLeft: -10 }}>
              <Tok who={PARTNER} size={34} ring />
            </View>
          </View>
        </View>

        {/* Mutual accountability card (us-soft) */}
        <View
          style={{
            backgroundColor: 'rgba(157,149,245,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
            borderRadius: 22,
            padding: 16,
            marginBottom: 22,
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.ui,
              fontSize: 14.5,
              lineHeight: 21.75,
              fontWeight: '600',
              color: colors.ink,
              textAlign: 'center',
            }}
          >
            This one's <Text style={{ fontStyle: 'italic', color: colors.ink }}>shared</Text>. If <Text style={{ fontWeight: '700', color: colors.ink }}>either</Text> of you skips a day, it resets to zero, so you keep each other honest.
          </Text>
        </View>

        {/* This week */}
        <View style={{ marginTop: 22, marginBottom: 10 }}>
          <Kick>this week</Kick>
        </View>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 20,
            paddingVertical: 16,
            paddingHorizontal: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <View
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 10,
                  lineHeight: 14,
                  color: colors.inkMute,
                }}
              >
                {day}
              </Text>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.pill,
                  backgroundColor: week[idx]
                    ? colors.p2
                    : colors.sunken,
                  borderWidth: idx === 6 ? 1.5 : 0,
                  borderColor: idx === 6 ? colors.p1 : 'transparent',
                  borderStyle: idx === 6 ? 'dashed' : 'solid',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {week[idx] ? (
                  <Icon d={ICONS.check} size={15} color="#fff" sw={2.4} />
                ) : idx === 6 ? (
                  <Text style={{ fontSize: 13 }}>🔥</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Countdown text */}
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            lineHeight: 16,
            fontWeight: '700',
            color: colors.p1Deep,
            textAlign: 'center',
            marginTop: 10,
            marginBottom: 24,
          }}
        >
          play today to keep it alive, 9h 12m left
        </Text>

        {/* Milestones */}
        <View style={{ marginTop: 24, marginBottom: 10 }}>
          <Kick>milestones · next at {next}</Kick>
        </View>
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 22,
            padding: 18,
          }}
        >
          {/* Progress bar */}
          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: colors.sunken,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${prog * 100}%`,
                backgroundColor: '#9D95F5',
                borderRadius: 999,
              }}
            />
          </View>

          {/* Milestone icons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            {MILES.map((miles) => {
              const hit = streak >= miles;
              const isNext = miles === next;
              return (
                <Press
                  key={miles}
                  onPress={() => handleMilestonePress(miles)}
                  scale={hit || isNext}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      backgroundColor: hit
                        ? '#9D95F5'
                        : isNext
                        ? colors.surface
                        : colors.sunken,
                      borderWidth: isNext ? 2 : 0,
                      borderColor: isNext ? colors.p2 : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      ...(hit ? shadows.shadowSoft : {}),
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {hit ? '🔥' : isNext ? '✨' : '🔒'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 10,
                      lineHeight: 15,
                      fontWeight: '700',
                      color: hit ? colors.p1Deep : colors.inkMute,
                      marginTop: 6,
                    }}
                  >
                    {miles}
                  </Text>
                </Press>
              );
            })}
          </View>
        </View>

        {/* Streak freeze card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 22,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
            marginTop: 14,
            marginBottom: 24,
          }}
        >
          {/* Ice emoji icon */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: 'rgba(90,141,238,0.14)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>🧊</Text>
          </View>

          {/* Description */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fontFamily.ui,
                fontSize: 14.5,
                lineHeight: 21.75,
                fontWeight: '700',
                color: colors.ink,
              }}
            >
              Streak freeze · {frozen ? 1 : 2} left
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.ui,
                fontSize: 12.5,
                lineHeight: 17.5,
                color: colors.inkSoft,
                marginTop: 2,
              }}
            >
              Life happens. A freeze saves your streak for one missed day, for both of you.
            </Text>
          </View>

          {/* Arm/Armed button */}
          <Press
            onPress={handleFreezePress}
            scale={false}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: frozen ? colors.sunken : colors.ink,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily.ui,
                  fontSize: 13,
                  lineHeight: 19.5,
                  fontWeight: '700',
                  color: frozen ? colors.inkMute : '#fff',
                }}
              >
                {frozen ? 'Armed' : 'Arm'}
              </Text>
            </View>
          </Press>

        </View>

        {/* Longest streak stat */}
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            lineHeight: 16,
            color: colors.inkMute,
            textAlign: 'center',
            marginTop: 18,
          }}
        >
          longest streak together · 41 days
        </Text>
      </ScrollView>

      {/* Toast notification */}
      {showToast && <Toast msg={showToast} />}
    </View>
  );
}
