import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  AccessibilityInfo,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
import { useReactions } from '../src/features/reactions/useReactions';
import ReactionRow from '../src/features/reactions/ReactionRow';
import * as haptics from '../src/lib/haptics';
import type { RevealScore } from '../src/domain/reveal';
import type { PromptAnswers } from '../src/domain/reveal';
import { mutualReadRun, biggestMissIndex } from '../src/domain/reveal';
import { coupleAgeDays } from '../src/features/drops/useTodayState';
import { usePurchases } from '../src/features/purchases/usePurchases';
import { shouldOfferPlus } from '../src/features/purchases/paywallMoments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { track, EVENTS } from '../src/lib/analytics';

const WIDGET_PROMPT_DISMISSED_KEY = 'reveal-widget-prompt-dismissed';

// Ring (src/components/Ring) climbs for 1100ms after `show` flips at 80ms.
const RING_START_MS = 80;
const RING_DURATION_MS = 1100;

// Twin badge 👯 pops in with a subtle spring once the compare card settles.
function TwinPop() {
  const scale = useSharedValue(0.3);
  useEffect(() => {
    scale.value = withDelay(420, withSpring(1, { damping: 12, stiffness: 170 }));
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Text allowFontScaling={false} style={{ fontSize: 17 }}>
        👯
      </Text>
    </Animated.View>
  );
}

function SparkleParticle({
  angle,
  dist,
  emoji,
  delay,
}: {
  angle: number;
  dist: number;
  emoji: string;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value },
      { scale: 0.5 + 0.6 * t.value },
    ],
    opacity: t.value < 0.65 ? 1 : Math.max(0, 1 - (t.value - 0.65) / 0.35),
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <Text allowFontScaling={false} style={{ fontSize: 15, color: colors.ink }}>
        {emoji}
      </Text>
    </Animated.View>
  );
}

/**
 * One-shot gentle sparkle burst — ~12 emoji particles drifting outward from
 * the center, fading as they go. Skipped entirely when the user prefers
 * reduced motion. Shared by the reveal (>=70 wave) and the milestone screen.
 */
export function SparkleBurst({
  count = 12,
  radius: burstRadius = 96,
  emojis = ['✨', '💫', '⭐️'],
  delay = 0,
  style,
}: {
  count?: number;
  radius?: number;
  emojis?: string[];
  delay?: number;
  style?: ViewStyle;
}) {
  const [motionOk, setMotionOk] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (alive && !reduced) setMotionOk(true);
      })
      .catch(() => {
        if (alive) setMotionOk(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!motionOk) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {Array.from({ length: count }, (_, i) => (
        <SparkleParticle
          key={i}
          angle={(i / count) * Math.PI * 2}
          dist={burstRadius * (i % 2 === 0 ? 1 : 0.72)}
          emoji={emojis[i % emojis.length]}
          delay={delay + i * 36}
        />
      ))}
    </View>
  );
}

export default function RevealScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { couple } = useCouple();
  const { me, partner } = useIdentity();
  const playState = usePlayStore();
  const coupleDropId = playState.coupleDropId;

  // Server reveal data (required for live sessions; demo computes locally)
  const [serverReveal, setServerReveal] = useState<{
    reveal: RevealScore;
    promptAnswers: PromptAnswers[];
    prompts: Array<{ id: string; emoji: string | null; question: string | null; options: string[] }>;
    caughtUp: boolean;
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

  // Reactions live only for the real couple's drop (RLS opens them post-reveal).
  const { reactions, myId, react } = useReactions(isLive ? coupleDropId : null);

  useEffect(() => {
    track(EVENTS.REVEAL_VIEWED);
    const t = setTimeout(() => setShow(true), RING_START_MS);
    const t2 = setTimeout(() => setAligned(true), 780);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  // Haptic beats synced to the ring: light ticks while it climbs, a success
  // thump when it lands. Starts when the ring actually renders (liveReady).
  useEffect(() => {
    if (!liveReady) return;
    const ticks = [0.22, 0.48, 0.74].map((frac) =>
      setTimeout(() => haptics.lightTick(), RING_START_MS + RING_DURATION_MS * frac)
    );
    const land = setTimeout(() => haptics.success(), RING_START_MS + RING_DURATION_MS);
    return () => {
      ticks.forEach(clearTimeout);
      clearTimeout(land);
    };
  }, [liveReady]);

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
          caughtUp: result.caughtUp,
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

  // --- reveal reframe (STRATEGY §4.3, laws #1/#3): for a real couple the round's
  // STORY leads — twins, then the best read — and the wave% demotes to a small
  // supporting stat. The score is earned, not the headline. Demo keeps its shape.
  const promptTotal = renderPrompts.length || 3;
  const heroTwins = reveal.twins;
  const bestRead = reveal.yourHits;
  const heroLine =
    heroTwins > 0
      ? `${heroTwins} twin answer${heroTwins === 1 ? '' : 's'} tonight`
      : bestRead > 0
        ? `you read ${partner.name} right on ${bestRead} of ${promptTotal}`
        : `all new angles on ${partner.name} tonight`;

  // Verdict roasts the ROUND, never the relationship (law #3). Live narrates the
  // night's shape; demo keeps the focus adjectives.
  const verdict = isLive
    ? heroTwins > 0
      ? 'Some you nailed without even guessing.'
      : bestRead > 0
        ? 'A few reads landed, a few caught you off guard.'
        : 'Tonight was pure discovery — the fun part.'
    : reveal.wave >= 80
      ? 'Crystal clear. You see in 3D.'
      : reveal.wave >= 55
        ? 'Mostly in focus.'
        : "A little blurry, that's the fun part.";

  // --- 1.5: the reveal is the reward ---------------------------------------
  // Escalation + conversation spark come from the REAL answer pairs (live only).
  const liveAnswers = isLive ? serverReveal?.promptAnswers ?? [] : [];
  const readRun = mutualReadRun(liveAnswers);
  const missIdx = liveAnswers.length ? biggestMissIndex(liveAnswers) : null;
  const missPrompt = missIdx != null ? renderPrompts[missIdx] : null;
  const missAnswers = missIdx != null ? liveAnswers[missIdx] : null;
  const [sparkOpen, setSparkOpen] = useState(false);

  // North star: "did this bring you closer?" — the author's own signal, never
  // shown to the partner (RLS is author-only). One tap, then the row swaps to
  // an ack for the rest of the session; the unique constraint server-side
  // makes any re-ask harmless.
  const [closenessAnswer, setClosenessAnswer] = useState<boolean | null>(null);
  const handleCloseness = (closer: boolean) => {
    if (!coupleDropId) return;
    setClosenessAnswer(closer);
    track(EVENTS.CLOSENESS_FEEDBACK, { closer });
    // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
    supabase.rpc('record_closeness', { p_couple_drop: coupleDropId, p_closer: closer }).then(() => {});
  };

  // --- 2.3: first-week beats on the reveal ----------------------------------
  const ageDays = coupleAgeDays(couple?.created_at ?? null, new Date());
  const dayTwoTwin = isLive && ageDays === 2 && reveal.twins > 0;
  // D3+: promote the widget at the post-reveal peak, once, dismissible.
  const [widgetPromptHidden, setWidgetPromptHidden] = useState(true);
  useEffect(() => {
    if (!isLive || ageDays < 3) return;
    let cancelled = false;
    AsyncStorage.getItem(WIDGET_PROMPT_DISMISSED_KEY)
      .then((v) => {
        if (!cancelled && v !== '1') setWidgetPromptHidden(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLive, ageDays]);
  const dismissWidgetPrompt = () => {
    setWidgetPromptHidden(true);
    AsyncStorage.setItem(WIDGET_PROMPT_DISMISSED_KEY, '1').catch(() => {});
  };
  const handleWidgetPrompt = () => {
    dismissWidgetPrompt();
    router.push('/widgetSetup');
  };

  // 5.4: the Plus ask lands only at the moment of delight — post-reveal, past
  // day 0 — and never stacks on top of the widget ask.
  const isPro = usePurchases((s) => s.isPro);
  const offerPlus =
    isLive &&
    liveReady &&
    widgetPromptHidden &&
    shouldOfferPlus({
      coupleAgeDays: ageDays,
      hadFirstReveal: true,
      isPro,
      context: 'post_reveal',
    });
  const handlePlusOffer = () => {
    track(EVENTS.PAYWALL_VIEWED, { context: 'post_reveal' });
    router.push('/(sheets)/plus');
  };

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

  const handleScience = () => {
    router.push('/science');
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

            {isLive ? (
              /* STORY HERO — the round's story leads; the score demotes below */
              <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 2, alignSelf: 'stretch' }}>
                <Serif s={40} italic c={colors.ink} style={{ textAlign: 'center' }}>
                  {heroLine}
                </Serif>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
                >
                  <Tok who={{ name: me.name, initial: me.initial }} you size={30} decorative />
                  <Tok who={{ name: partner.name, initial: partner.initial }} size={30} decorative />
                </View>
              </View>
            ) : (
              /* Demo keeps the ring as its hero */
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
                  <Kick style={{ marginTop: 4 }}>
                    {serverReveal?.caughtUp ? 'in sync · caught up at 80%' : 'in sync'}
                  </Kick>
                </View>
                {/* A high wave earns a one-shot gentle sparkle as the ring lands */}
                {reveal.wave >= 70 && (
                  <SparkleBurst radius={112} delay={RING_START_MS + RING_DURATION_MS} />
                )}
              </View>
            )}

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

            {/* Live: the wave% lives here now — a smaller, earned supporting stat,
                still animated, never the headline (STRATEGY §4.3) */}
            {isLive && (
              <View style={{ marginTop: 18, alignItems: 'center' }}>
                <View
                  style={{
                    position: 'relative',
                    width: 88,
                    height: 88,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ring pct={show ? reveal.wave : 0} size={88} />
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
                        fontSize: 26,
                        lineHeight: 26,
                        paddingRight: 2,
                      }}
                    >
                      {`${reveal.wave}%`}
                    </GradientText>
                  </View>
                  {reveal.wave >= 70 && (
                    <SparkleBurst radius={96} delay={RING_START_MS + RING_DURATION_MS} />
                  )}
                </View>
                <Kick style={{ marginTop: 6 }}>
                  {serverReveal?.caughtUp ? 'in sync · caught up at 80%' : 'in sync'}
                </Kick>
              </View>
            )}

            {/* 1.5: back-to-back mutual reads get the escalation line */}
            {readRun >= 3 && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Kick c={colors.matchDeep}>{readRun} hunches in a row 🔥</Kick>
              </View>
            )}
            {/* 2.3 D2: the first twin moment gets named on day two */}
            {dayTwoTwin && (
              <View style={{ marginTop: readRun >= 3 ? 6 : 12, alignItems: 'center' }}>
                <Kick c={colors.p2Deep}>day two and already twinning 👯</Kick>
              </View>
            )}
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
                    {isTwin && <TwinPop />}
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

                  {/* Tap-once reaction to the partner's answer (live only —
                      the discussion opener; RLS gates it to post-reveal) */}
                  {isLive && (
                    <ReactionRow
                      promptId={prompt.id}
                      myEmoji={
                        reactions.find((r) => r.prompt_id === prompt.id && r.author === myId)
                          ?.emoji ?? null
                      }
                      partnerEmoji={
                        reactions.find((r) => r.prompt_id === prompt.id && r.author !== myId)
                          ?.emoji ?? null
                      }
                      partnerName={partner.name}
                      onReact={react}
                    />
                  )}
                </Card>
              );
            })}
          </View>

          {/* 1.5: the conversation spark — the biggest miss IS the payload */}
          {missPrompt && missAnswers && (
            <Press
              onPress={() => setSparkOpen((v) => !v)}
              scale={false}
              accessibilityLabel="Tonight's conversation spark"
            >
              <Card style={{ marginTop: 20, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 22 }}>
                <Kick c={colors.p1Deep}>tonight's conversation</Kick>
                <Text
                  allowFontScaling={false}
                  style={{
                    marginTop: 6,
                    fontSize: 14.5,
                    lineHeight: 20,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {missPrompt.emoji} {missPrompt.q}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    lineHeight: 18.5,
                    color: colors.inkSoft,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {missAnswers.youHunch !== missAnswers.themPick &&
                  missPrompt.opts[missAnswers.youHunch] != null &&
                  missPrompt.opts[missAnswers.themPick] != null
                    ? `you guessed "${missPrompt.opts[missAnswers.youHunch]}" — ${partner.name} actually picked "${missPrompt.opts[missAnswers.themPick]}".`
                    : `${partner.name} read you differently on this one.`}
                </Text>
                {sparkOpen && (
                  <Text
                    allowFontScaling={false}
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      lineHeight: 18.5,
                      fontStyle: 'italic',
                      color: colors.inkSoft,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    opener: “okay, what made it true for you?” — the why is the good part.
                  </Text>
                )}
                <Kick style={{ marginTop: 8 }}>{sparkOpen ? 'tap to tuck away' : 'tap for an opener'}</Kick>
              </Card>
            </Press>
          )}

          {/* North star: one quiet post-reveal question — the answer stays the
              author's own (never the partner's to see) */}
          {isLive && !!serverReveal && (
            <View style={{ marginTop: 14, minHeight: 34, justifyContent: 'center' }}>
              {closenessAnswer == null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      flex: 1,
                      fontSize: 12.5,
                      lineHeight: 17,
                      color: colors.inkSoft,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    did tonight bring you two closer?
                  </Text>
                  <Press
                    onPress={() => handleCloseness(true)}
                    scale={false}
                    style={{ width: 'auto' }}
                    accessibilityLabel="Closer"
                  >
                    <View
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: 'rgba(255,253,253,0.72)',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 12,
                          lineHeight: 16,
                          fontWeight: '600',
                          color: colors.matchDeep,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        🌱 closer
                      </Text>
                    </View>
                  </Press>
                  <Press
                    onPress={() => handleCloseness(false)}
                    scale={false}
                    style={{ width: 'auto' }}
                    accessibilityLabel="Not really"
                  >
                    <View
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: 'rgba(255,253,253,0.72)',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 12,
                          lineHeight: 16,
                          fontWeight: '600',
                          color: colors.inkSoft,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        😐 not really
                      </Text>
                    </View>
                  </Press>
                </View>
              ) : (
                <Text
                  allowFontScaling={false}
                  style={{
                    textAlign: 'center',
                    fontSize: 12.5,
                    lineHeight: 17,
                    color: colors.inkMute,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {closenessAnswer
                    ? 'noted — quietly, just for you 🌱'
                    : 'some nights are quieter — noted, just for you 😌'}
                </Text>
              )}
            </View>
          )}

          {/* 2.3 D3+: the widget ask lands at the post-reveal peak, once */}
          {isLive && !widgetPromptHidden && (
            <Card style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>📱</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Put {partner.name} on your home screen
                  </Text>
                  <Kick style={{ marginTop: 3 }}>
                    the widget flips the moment they play
                  </Kick>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Btn kind="us" onPress={handleWidgetPrompt}>Add the widget</Btn>
                </View>
                <View style={{ flex: 1 }}>
                  <Btn kind="soft" onPress={dismissWidgetPrompt}>Not now</Btn>
                </View>
              </View>
            </Card>
          )}

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

          {/* Quiet trust surface — the grounding behind the reveal (R6) */}
          <Press onPress={handleScience} scale={false} accessibilityLabel="The science behind parallax">
            <Kick c={colors.inkMute} style={{ marginTop: 18, textAlign: 'center' }}>
              the science behind parallax →
            </Kick>
          </Press>

          {/* 5.4: quiet Plus line at the moment of delight — never blocks the
              loop, never day-0, never pre-first-reveal, never for Pro */}
          {offerPlus && (
            <Press onPress={handlePlusOffer} scale={false} accessibilityLabel="See Parallax Plus">
              <Text
                allowFontScaling={false}
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  fontSize: 12.5,
                  lineHeight: 18,
                  color: colors.inkMute,
                  fontFamily: fontFamily.ui,
                }}
              >
                loved tonight's reveal? Plus adds themed packs + your full archive →
              </Text>
            </Press>
          )}
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
          <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} style={{ borderRadius: radius.pill }}>
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
