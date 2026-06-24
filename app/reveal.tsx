import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { usePlayStore, computeReveal } from '../src/store/play';
import { DROP } from '../src/content/drop';
import { peekMoodForWave } from '../src/domain/wavelength';
import { colors, gradients, shadows, space, radius } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import { Peek } from '../src/components/Peek';
import { Float } from '../src/components/Float';
import { Wordmark } from '../src/components/Wordmark';
import { Ring } from '../src/components/Ring';
import Stat from '../src/components/Stat';
import Card from '../src/components/Card';
import Btn from '../src/components/Btn';
import GradientText from '../src/components/GradientText';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { fetchReveal } from '../src/features/drops/dropActions';
import type { RevealScore } from '../src/domain/reveal';
import type { PromptAnswers } from '../src/domain/reveal';
import { track, EVENTS } from '../src/lib/analytics';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

export default function RevealScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const playState = usePlayStore();
  const coupleDropId = playState.coupleDropId;

  // Server reveal data (populated when session+couple+coupleDropId)
  const [serverReveal, setServerReveal] = useState<{
    reveal: RevealScore;
    promptAnswers: PromptAnswers[];
  } | null>(null);

  // Computed from local store (demo fallback)
  const localReveal = computeReveal(playState);

  const reveal = serverReveal?.reveal ?? localReveal;

  const [show, setShow] = useState(false);
  const [aligned, setAligned] = useState(false);

  useEffect(() => {
    track(EVENTS.REVEAL_VIEWED);
    const t = setTimeout(() => setShow(true), 80);
    const t2 = setTimeout(() => setAligned(true), 780);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!session || !couple || !coupleDropId) return;
    fetchReveal(coupleDropId).then((result) => {
      setServerReveal({ reveal: result.reveal, promptAnswers: result.promptAnswers });
    }).catch(() => {
      // fall through to local demo reveal on error
    });
  }, [session, couple, coupleDropId]);

  const verdict =
    reveal.wave >= 80
      ? 'Crystal clear. You see in 3D.'
      : reveal.wave >= 55
        ? 'Mostly in focus.'
        : "A little blurry, that's the fun part.";

  const peekMood = peekMoodForWave(reveal.wave);

  const handleShare = () => {
    router.push('/(sheets)/share');
  };

  const handleDone = () => {
    safeBack(router);
  };

  const handleClose = () => {
    safeBack(router);
  };

  const handleThreadOpen = (promptId: string) => {
    router.push(`/thread?promptId=${promptId}`);
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 6,
            paddingBottom: 140,
          }}
        >
          {/* Header section */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            {/* Peek animation */}
            <Float duration={4000} style={{ marginBottom: 8 }}>
              <Peek size={72} mood={peekMood} />
            </Float>

            {/* Wordmark with animation */}
            <View style={{ marginBottom: 6 }}>
              <Wordmark size={26} offset={!aligned} />
            </View>

            <Kick c={colors.inkMute}>{aligned ? 'in focus' : 'the reveal'}</Kick>

            {/* Ring with percentage */}
            <View
              style={{
                position: 'relative',
                width: 168,
                height: 168,
                marginVertical: 18,
                alignSelf: 'center',
              }}
            >
              <Ring pct={show ? reveal.wave : 0} size={168} />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GradientText
                  style={{
                    fontFamily: fontFamily.disp,
                    fontSize: 50,
                    lineHeight: 50,
                    paddingRight: 3,
                  }}
                >
                  {`${reveal.wave}%`}
                </GradientText>
                <Kick style={{ marginTop: 4 }}>in sync</Kick>
              </View>
            </View>

            {/* Verdict text with anaglyph effect — coral ghost left, periwinkle right */}
            <View style={{ marginTop: 6, marginBottom: 4, alignSelf: 'stretch' }}>
              <Serif s={32} italic style={{ opacity: 0 }}>
                {verdict}
              </Serif>
              <Serif
                s={32}
                italic
                c="rgba(255,142,122,0.45)"
                style={{ position: 'absolute', top: 0, bottom: 0, left: -1, right: 1 }}
              >
                {verdict}
              </Serif>
              <Serif
                s={32}
                italic
                c="rgba(157,149,245,0.45)"
                style={{ position: 'absolute', top: 0, bottom: 0, left: 1, right: -1 }}
              >
                {verdict}
              </Serif>
              <Serif s={32} italic style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                {verdict}
              </Serif>
            </View>

            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13.5,
                color: colors.inkSoft,
                maxWidth: 290,
                marginHorizontal: 'auto',
                marginTop: 8,
                lineHeight: 20,
                textAlign: 'center',
              }}
            >
              The out-of-focus bits aren't fails, they're tonight's conversation.
            </Text>

            {/* Stats row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 20,
                marginTop: 16,
              }}
            >
              <Stat
                big={`${reveal.yourHits + reveal.theirHits}/${DROP.prompts.length * 2}`}
                label="hunches landed"
              />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat big={String(reveal.twins)} label="twin moments" grad />
            </View>
          </View>

          {/* Per-prompt compare cards */}
          <View style={{ marginTop: 26, gap: 12 }}>
            {DROP.prompts.map((prompt, i) => {
              // Server path: use promptAnswers from fetchReveal (index-aligned to DROP.prompts)
              const serverAnswers = serverReveal?.promptAnswers[i];
              const myChoice = serverAnswers?.youPick ?? playState.myPicks[i] ?? prompt.youDemo;
              const theirChoice = serverAnswers?.themPick ?? prompt.remy;
              const myHunch = serverAnswers?.youHunch ?? playState.myHunches[i] ?? prompt.youHunchDemo;
              const theirHunch = serverAnswers?.themHunch ?? prompt.remyHunch;

              const isTwin = myChoice === theirChoice;
              const hunchOk = myHunch === theirChoice;

              const noteIdx = isTwin ? 0 : hunchOk ? 1 : 2;

              return (
                <Card
                  key={i}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 15,
                    borderRadius: 22,
                  }}
                >
                  {/* Question header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 9,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{ fontSize: 19 }}
                    >
                      {prompt.emoji}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 14.5,
                        fontWeight: '700',
                        lineHeight: 20,
                        color: colors.ink,
                        fontFamily: fontFamily.ui,
                        flex: 1,
                      }}
                    >
                      {prompt.q}
                    </Text>
                    {isTwin && (
                      <Text
                        allowFontScaling={false}
                        style={{ fontSize: 17 }}
                      >
                        👯
                      </Text>
                    )}
                  </View>

                  {/* Compare chips */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[
                      {
                        label: 'you',
                        choice: myChoice,
                        color: colors.p1Deep,
                        bg: 'rgba(255,142,122,0.14)',
                      },
                      {
                        label: 'Dani',
                        choice: theirChoice,
                        color: colors.p2Deep,
                        bg: 'rgba(157,149,245,0.16)',
                      },
                    ].map((side, k) => (
                      <View key={k} style={{ flex: 1 }}>
                        <Kick c={side.color} style={{ marginBottom: 6 }}>
                          {side.label}
                        </Kick>
                        <View
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingHorizontal: 14,
                            paddingVertical: 11,
                            borderRadius: 16,
                            backgroundColor: side.bg,
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontSize: 13.5,
                              fontWeight: '600',
                              lineHeight: 18,
                              color: side.color,
                              fontFamily: fontFamily.ui,
                            }}
                          >
                            {prompt.opts[side.choice]}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Hunch check/cross row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingTop: 11,
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                    }}
                  >
                    <View
                      style={{
                        flexShrink: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: radius.pill,
                        backgroundColor: hunchOk
                          ? 'rgba(84,194,160,0.16)'
                          : 'rgba(157,149,245,0.16)',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 11.5,
                          fontWeight: '700',
                          color: hunchOk
                            ? colors.matchDeep
                            : colors.p2Deep,
                          fontFamily: fontFamily.mono,
                          letterSpacing: 0.8,
                        }}
                      >
                        {hunchOk ? '🎯 in focus' : '👀 parallax'}
                      </Text>
                    </View>

                    <Text
                      allowFontScaling={false}
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.inkSoft,
                        fontFamily: fontFamily.ui,
                        lineHeight: 18,
                      }}
                    >
                      {prompt.note[noteIdx]}
                    </Text>

                    <Press
                      onPress={() => handleThreadOpen(prompt.id)}
                      scale={false}
                      style={{ width: 'auto' }}
                      accessibilityLabel="Open discussion thread"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderRadius: radius.pill,
                          backgroundColor: colors.sunken,
                        }}
                      >
                        <Icon
                          d={ICONS.chat}
                          size={13}
                          color={colors.inkSoft}
                        />
                        {i === 0 && (
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: colors.p2Deep,
                              fontFamily: fontFamily.mono,
                              letterSpacing: 1.6,
                            }}
                          >
                            3
                          </Text>
                        )}
                      </View>
                    </Press>
                  </View>

                  {/* Why section */}
                  <View
                    style={{
                      marginTop: 11,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 8.5,
                        fontWeight: '700',
                        lineHeight: 11,
                        letterSpacing: 2.2,
                        color: colors.inkMute,
                        fontFamily: fontFamily.mono,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      WHY
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 11.5,
                        lineHeight: 17,
                        color: colors.inkSoft,
                        fontFamily: fontFamily.ui,
                        fontStyle: 'italic',
                      }}
                    >
                      {prompt.why}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Action buttons */}
          <View style={{ marginTop: 20 }}>
            <Btn kind="us" onPress={handleShare} sub="brag a little">
              Share your wavelength
            </Btn>
          </View>
          <View style={{ marginTop: 11 }}>
            <Btn kind="soft" onPress={handleDone} sub="next drop in 9h">
              Done for today
            </Btn>
          </View>
        </ScrollView>

        {/* Close button - absolute positioned */}
        <Press
          onPress={handleClose}
          scale={false}
          style={{
            position: 'absolute',
            top: 54,
            right: 18,
            zIndex: 30,
            width: 'auto',
          }}
          accessibilityLabel="Close reveal"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <BlurView intensity={40} style={{ borderRadius: radius.pill }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,253,253,0.72)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.6)',
                ...shadows.shadowSoft,
              }}
            >
              <Icon d={ICONS.close} size={15} color={colors.ink} sw={2} />
            </View>
          </BlurView>
        </Press>
      </SafeAreaView>
    </LinearGradient>
  );
}
