import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { useIdentity } from '../src/features/profile/useIdentity';
import { submitMyAnswers, ensureYesterdayDrop, getDropContent } from '../src/features/drops/dropActions';
import type { DropContent } from '../src/features/drops/dropActions';
import { useTodayState } from '../src/features/drops/useTodayState';
import { useUiStore } from '../src/store/ui';
import { track, EVENTS } from '../src/lib/analytics';

export default function PlayScreen() {
  const router = useRouter();
  const { catchup } = useLocalSearchParams<{ catchup?: string }>();
  const { session } = useSession();
  const { couple } = useCouple();
  const { me, partner } = useIdentity();
  const { idx, phase, myPicks, myHunches, reset } = usePlayStore();
  const { today, content } = useTodayState(session && couple ? couple.id : null);
  const [submitting, setSubmitting] = useState(false);
  // Catch-up mode (0021): playing YESTERDAY's drop, scored at 80%.
  const isCatchUp = catchup === '1';
  const [catchUpContent, setCatchUpContent] = useState<DropContent | null>(null);
  // The exact drop these prompts belong to — submit by id, never re-resolve.
  // A midnight-straddling session must not map answers onto the next day's
  // questions (the ensure_* fns resolve by couple-local date at call time).
  const [catchUpDropId, setCatchUpDropId] = useState<string | null>(null);
  // Guards the answer→hunch / hunch→next-prompt transition: a tap landing
  // during the re-render otherwise binds to the NEW phase's option at the
  // same position (E2E finding F6).
  const transitionLock = React.useRef(false);
  const isLive = !!(session && couple);
  // Live couples play the drop the server assigned (rotation-aware); the
  // unauthenticated demo plays the static content. Never mix mid-session.
  // A catch-up plays yesterday's assigned drop instead of today's.
  const prompts = isLive
    ? (isCatchUp ? catchUpContent?.prompts ?? null : content?.prompts ?? null)
    : DROP.prompts;
  const prompt = prompts ? prompts[idx] : null;
  const isPick = phase === 'pick';
  const color = isPick ? colors.p1 : colors.p2;
  const deepColor = isPick ? colors.p1Deep : colors.p2Deep;
  const selected = isPick ? myPicks[idx] : myHunches[idx];

  const total = (prompts?.length ?? 3) * 2;
  const step = idx * 2 + (isPick ? 1 : 2);

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Catch-up: open yesterday's drop (minted server-side if never opened) and
  // load ITS prompts. On failure, fall back honestly to Today.
  useEffect(() => {
    if (!isCatchUp || !isLive || !couple) return;
    let cancelled = false;
    (async () => {
      try {
        const yesterdayId = await ensureYesterdayDrop(couple.id);
        const yesterdayContent = await getDropContent(yesterdayId);
        if (cancelled) return;
        if (!yesterdayContent) throw new Error('no content');
        setCatchUpContent(yesterdayContent);
        setCatchUpDropId(yesterdayId);
      } catch {
        if (!cancelled) safeBack(router);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCatchUp, isLive, couple, router]);

  const choose = async (optionIdx: number) => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setTimeout(() => {
      transitionLock.current = false;
    }, 420);
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
      const isLast = idx === (prompts?.length ?? 3) - 1;
      if (!isLast) {
        usePlayStore.setState({ idx: idx + 1, phase: 'pick' });
      } else {
        // Final submit: either via Supabase (if session + couple) or local fallback
        if (session && couple) {
          if (submitting) return;
          setSubmitting(true);
          const currentState = usePlayStore.getState();
          try {
            const result = await submitMyAnswers(
              couple.id,
              currentState.myPicks,
              currentState.myHunches,
              {
                catchUp: isCatchUp,
                coupleDropId: isCatchUp
                  ? catchUpDropId ?? undefined
                  : today?.couple_drop_id,
              }
            );
            track(EVENTS.DROP_SUBMITTED);
            // D0 funnel: first answer submitted (not a catch-up)
            if (!isCatchUp) {
              const firstAnswerKey = `first-answer-tracked-${couple.id}`;
              AsyncStorage.getItem(firstAnswerKey)
                .then((seen) => {
                  if (seen !== '1') {
                    track(EVENTS.FIRST_ANSWER_SUBMITTED);
                    AsyncStorage.setItem(firstAnswerKey, '1').catch(() => {});
                  }
                })
                .catch(() => {});
            }
            usePlayStore.setState({ done: true, coupleDropId: result.coupleDropId });
            // Second submitter: the reveal is ready — skip the waiting room.
            const dest = result.state === 'revealed' ? '/reveal' : '/waiting';
            setTimeout(() => {
              router.push(dest);
            }, 220);
          } catch (_err) {
            // Honest failure: stay here with answers intact so a re-tap retries.
            // Never pretend the submit landed (no fake done, no fake reveal).
            setSubmitting(false);
            useUiStore
              .getState()
              .fireToast("Couldn't send your answers — check your connection and tap again");
          }
        } else {
          track(EVENTS.DROP_SUBMITTED, { demo: true });
          usePlayStore.setState({ done: true });
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

  // Live session before the assigned drop's content arrives: brief hold so a
  // couple never starts on static questions that swap mid-play.
  if (!prompt) {
    return (
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <DawnBlobs />
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Kick c={colors.inkSoft}>
            {isCatchUp ? "opening yesterday's drop…" : "loading today's drop…"}
          </Kick>
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
          <Press
            onPress={handleBack}
            scale={false}
            style={{ width: 'auto' }}
            accessibilityLabel="Back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
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
            <LinearGradient
              colors={gradients.us.colors}
              locations={gradients.us.locations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${(step / total) * 100}%`,
                borderRadius: radius.pill,
              }}
            />
          </View>
          <Kick>
            {idx + 1}/{prompts?.length ?? 3}
          </Kick>
        </View>

        {/* Catch-up rounds say so up front — the 80% rule is never a surprise */}
        {isCatchUp && (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: 10 }}>
            <Kick c={colors.p2Deep}>yesterday's drop · scored at 80%</Kick>
          </View>
        )}

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
            <Tok
              who={isPick ? { initial: me.initial } : { initial: partner.initial, name: partner.name }}
              size={20}
              you={isPick}
            />
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                fontWeight: '700',
                lineHeight: 18,
                color: deepColor,
                fontFamily: fontFamily.ui,
              }}
            >
              {isPick ? 'Your honest pick' : `Your hunch, what'll ${partner.name} say?`}
            </Text>
          </View>

          {/* Options */}
          <View style={{ display: 'flex', gap: 11, flex: 1 }}>
            {prompt.opts.map((option, oi) => {
              const isSelected = selected === oi;
              const phaseLabel = isPick ? 'Your pick' : 'Your hunch';
              return (
                <Press
                  key={oi}
                  onPress={() => choose(oi)}
                  scale={true}
                  accessibilityLabel={`${phaseLabel}: ${option}`}
                  accessibilityState={{ selected: isSelected }}
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
