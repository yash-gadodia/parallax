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
import { useIdentity } from '../src/features/profile/useIdentity';
import { fetchReveal } from '../src/features/drops/dropActions';
import type { RevealScore } from '../src/domain/reveal';
import type { PromptAnswers } from '../src/domain/reveal';
import { track, EVENTS } from '../src/lib/analytics';

export default function RevealScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const { partner } = useIdentity();
  const playState = usePlayStore();
  const coupleDropId = playState.coupleDropId;

  // Server reveal data (required for live sessions; demo computes locally)
  const [serverReveal, setServerReveal] = useState<{
    reveal: RevealScore;
    promptAnswers: PromptAnswers[];
    prompts: Array<{ id: string; emoji: string | null; question: string | null; options: string[] }>;
  } | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const isLive = !!(session && couple);

  // Demo-only local score. A live session NEVER falls back to this — showing
  // a fabricated reveal to a real couple is worse than an honest error.
  const localReveal = computeReveal(playState);
  const reveal = isLive ? serverReveal?.reveal ?? localReveal : localReveal;
  const liveReady = !isLive || !!serverReveal;

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
    if (!isLive) return;
    if (!coupleDropId) {
      setFetchFailed(true);
      return;
    }
    setFetchFailed(false);
    fetchReveal(coupleDropId)
      .then((result) => {
        setServerReveal({
          reveal: result.reveal,
          promptAnswers: result.promptAnswers,
          prompts: result.prompts,
        });
      })
      .catch(() => {
        setFetchFailed(true);
      });
  }, [isLive, coupleDropId, attempt]);

  // Live path renders the ACTUAL prompts of this couple_drop (rotation-aware);
  // the demo path keeps the static content with its authored notes/why lines.
  const LIVE_NOTES: [string, string, string] = [
    'same answer, zero hints needed',
    'you called it',
    "different angles — that's tonight's conversation",
  ];
  const renderPrompts = isLive
    ? (serverReveal?.prompts ?? []).map((p) => ({
        id: p.id,
        emoji: p.emoji ?? '💬',
        q: p.question ?? '',
        opts: p.options,
        note: LIVE_NOTES as string[],
        why: undefined as string | undefined,
        youDemo: 0,
        youHunchDemo: 0,
        remy: 0,
        remyHunch: 0,
      }))
    : DROP.prompts.map((p) => ({ ...p, why: p.why as string | undefined }));

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


  // Live session, no server data yet: honest loading / error — never a fake reveal.
  if (!liveReady) {
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
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: space.gutter,
              gap: 14,
            }}
          >
            <Peek size={112} mood="search" />
            {fetchFailed ? (
              <>
                <Serif s={28} italic c={colors.ink} style={{ textAlign: 'center' }}>
                  can't reach your reveal
                </Serif>
                <Kick c={colors.inkSoft} style={{ textAlign: 'center' }}>
                  your answers are safe · check your connection
                </Kick>
                <View style={{ width: '100%', marginTop: 10 }}>
                  <Btn kind="ink" onPress={() => setAttempt((a) => a + 1)}>
                    Try again
                  </Btn>
                </View>
                <Press onPress={handleClose} scale={false} accessibilityLabel="Back to Today">
                  <Kick c={colors.inkMute} style={{ marginTop: 8 }}>
                    back to today
                  </Kick>
                </Press>
              </>
            ) : (
              <Kick c={colors.inkSoft}>fetching your reveal…</Kick>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
                big={`${reveal.yourHits + reveal.theirHits}/${(renderPrompts.length || 3) * 2}`}
                label="hunches landed"
              />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat big={String(reveal.twins)} label="twin moments" grad />
            </View>
          </View>

          {/* Per-prompt compare cards */}
          <View style={{ marginTop: 26, gap: 12 }}>
            {renderPrompts.map((prompt, i) => {
              // Server path: promptAnswers from fetchReveal, index-aligned to renderPrompts
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
                        label: partner.name,
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

                  </View>

                  {/* Why section (authored content only — no fabricated science lines) */}
                  {prompt.why != null && (
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
                        letterSpacing: 1.2,
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
                  )}
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
            <Btn kind="soft" onPress={handleDone} sub="next drop tomorrow">
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
