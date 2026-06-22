import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { usePlayStore } from '../src/store/play';
import { DROP } from '../src/content/drop';
import { colors, gradients, shadows, space, radius } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { submitMyAnswers } from '../src/features/drops/dropActions';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

export default function PlayScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const { idx, phase, myPicks, myHunches, reset } = usePlayStore();
  const [submitting, setSubmitting] = useState(false);
  const prompt = DROP.prompts[idx];
  const isPick = phase === 'pick';
  const color = isPick ? colors.p1 : colors.p2;
  const deepColor = isPick ? colors.p1Deep : colors.p2Deep;
  const selected = isPick ? myPicks[idx] : myHunches[idx];

  const total = DROP.prompts.length * 2;
  const step = idx * 2 + (isPick ? 1 : 2);

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  const choose = async (optionIdx: number) => {
    if (isPick) {
      usePlayStore.setState((s) => ({
        myPicks: s.myPicks.map((p, i) => (i === idx ? optionIdx : p)),
      }));
      setTimeout(() => {
        usePlayStore.setState({ phase: 'hunch' });
      }, 360);
    } else {
      usePlayStore.setState((s) => ({
        myHunches: s.myHunches.map((h, i) => (i === idx ? optionIdx : h)),
      }));
      const isLast = idx === DROP.prompts.length - 1;
      if (!isLast) {
        usePlayStore.setState({ idx: idx + 1, phase: 'pick' });
      } else {
        // Final submit: either via Supabase (if session + couple) or local fallback
        if (session && couple) {
          setSubmitting(true);
          try {
            const currentState = usePlayStore.getState();
            await submitMyAnswers(
              couple.id,
              currentState.myPicks,
              currentState.myHunches
            );
            setTimeout(() => {
              router.push('/waiting');
            }, 220);
          } catch (_err) {
            setSubmitting(false);
          }
        } else {
          setTimeout(() => {
            router.push('/waiting');
          }, 220);
        }
      }
    }
  };

  const handleBack = () => {
    if (idx === 0 && isPick) {
      safeBack(router);
    } else if (isPick) {
      usePlayStore.setState({ idx: idx - 1, phase: 'hunch' });
    } else {
      usePlayStore.setState({ phase: 'pick' });
    }
  };

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with back, progress bar, and counter */}
        <View
          style={{
            paddingHorizontal: space.gutter,
            paddingTop: 6,
            paddingBottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Press onPress={handleBack} scale={false} style={{ width: 'auto' }}>
            <Icon d={ICONS.back} size={22} color={colors.inkSoft} />
          </Press>
          <View
            style={{
              flex: 1,
              height: 7,
              borderRadius: radius.pill,
              backgroundColor: colors.sunken,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${(step / total) * 100}%`,
                backgroundColor: colors.p2,
                borderRadius: radius.pill,
              }}
            />
          </View>
          <Kick>
            {idx + 1}/{DROP.prompts.length}
          </Kick>
        </View>

        {/* Main content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 26,
            paddingBottom: 32,
          }}
          scrollEnabled={false}
        >
          {/* Emoji */}
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 50,
              marginBottom: 8,
              color: colors.ink,
            }}
          >
            {prompt.emoji}
          </Text>

          {/* Question */}
          <Serif s={34} style={{ marginBottom: 24 }}>
            {prompt.q}
          </Serif>

          {/* Phase badge */}
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 7,
              paddingHorizontal: 13,
              borderRadius: radius.pill,
              backgroundColor: isPick
                ? 'rgba(255,142,122,0.16)'
                : 'rgba(157,149,245,0.18)',
              marginBottom: 16,
            }}
          >
            <Tok who={isPick ? YOU : PAR} size={20} you={isPick} />
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: deepColor,
                fontFamily: fontFamily.ui,
              }}
            >
              {isPick ? 'Your honest pick' : "Your hunch, what'll Dani say?"}
            </Text>
          </View>

          {/* Options */}
          <View style={{ display: 'flex', gap: 11, flex: 1 }}>
            {prompt.opts.map((option, oi) => {
              const isSelected = selected === oi;
              return (
                <Press
                  key={oi}
                  onPress={() => choose(oi)}
                  scale={true}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 13,
                    paddingVertical: 17,
                    paddingHorizontal: 18,
                    borderRadius: 20,
                    backgroundColor: isSelected ? color : colors.surface,
                    borderWidth: 1.5,
                    borderColor: isSelected ? color : colors.line,
                    ...(isSelected ? shadows.shadow : shadows.shadowSoft),
                  }}
                >
                  {/* Radio button */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: radius.pill,
                      flexShrink: 0,
                      borderWidth: 2,
                      borderColor: isSelected ? '#fff' : colors.inkMute,
                      backgroundColor: isSelected ? '#fff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: radius.pill,
                          backgroundColor: deepColor,
                        }}
                      />
                    )}
                  </View>

                  {/* Option text */}
                  <Text
                    allowFontScaling={false}
                    style={{
                      flex: 1,
                      fontSize: 15.5,
                      fontWeight: '600',
                      lineHeight: 19,
                      color: isSelected ? '#fff' : colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {option}
                  </Text>
                </Press>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
