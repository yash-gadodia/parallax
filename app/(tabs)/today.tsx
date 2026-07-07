import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Share,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DawnBlobs } from '../../src/components/DawnBlobs';
import { Float } from '../../src/components/Float';
import { RadialGlow } from '../../src/components/RadialGlow';
import { Wordmark } from '../../src/components/Wordmark';
import { Peek } from '../../src/components/Peek';
import Tok from '../../src/components/Tok';
import Press from '../../src/components/Press';
import { Icon, ICONS } from '../../src/components/Icon';
import Card from '../../src/components/Card';
import Btn from '../../src/components/Btn';
import { Kick, Serif } from '../../src/components/Text';
import GradientText from '../../src/components/GradientText';
import { Skeleton } from '../../src/components/Skeleton';
import { colors, gradients, radius, shadows, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { DROP } from '../../src/content/drop';
import { usePlayStore, computeReveal } from '../../src/store/play';
import { useUiStore } from '../../src/store/ui';
import {
  useTodayState,
  coupleAgeDays,
  firstWeekBeat,
  isEvening,
  localDayKey,
} from '../../src/features/drops/useTodayState';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useActivity } from '../../src/features/engagement/useActivity';
import { nudge } from '../../src/features/engagement/engagementActions';
import { useCoupleHistory } from '../../src/features/lovemap/useCoupleHistory';
import { useJourneyState } from '../../src/features/journeys/useJourneyState';
import { stageProgressLabel } from '../../src/features/journeys/journeyLogic';
import { useSession } from '../../src/features/auth/useSession';
import { useProfile } from '../../src/features/profile/useProfile';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { selectDropForSpice, normaliseSpiceLevel } from '../../src/domain/spice';
import type { SpiceLevel } from '../../src/domain/spice';
import { syncWidgetFromToday } from '../../src/features/widget';
import {
  schedulePendingReminders,
  cancelPendingReminders,
} from '../../src/features/notifications';
import { track, EVENTS } from '../../src/lib/analytics';
import { useRefetchOnRefocus } from '../../src/lib/useRefetchOnRefocus';
import { MoodCheckCard } from '../../src/features/mood/MoodCheckCard';

// One-per-day dedupe keys (device-local day, see localDayKey).
const STREAK_PULSE_SEEN_KEY = 'parallax:streak_pulse_seen_on';
const NUDGE_SENT_KEY = 'parallax:nudge_sent_on';

export default function TodayScreen({
  // Injectable clock so the time-of-day and couple-age logic is exact-testable.
  now = () => new Date(),
}: {
  now?: () => Date;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const playState = usePlayStore();
  const { session } = useSession();
  const { couple } = useCouple();
  const { today, content, loading: todayLoading } = useTodayState(
    session && couple ? couple.id : null
  );
  const { items: dbActivity, unreadCount } = useActivity(couple?.id || null);
  const { history } = useCoupleHistory();
  // The milestone journey surface (0028): a quiet row, never a shout.
  const {
    state: journeyState,
    stages: journeyStages,
    refetch: refetchJourney,
  } = useJourneyState(session && couple ? couple.id : null);
  // The journey row goes stale after a check-in/advance on the pushed journey
  // screen — refresh it whenever the tab regains focus.
  useRefetchOnRefocus(refetchJourney);
  const { spiceLevel } = useProfile();
  const { me, partner } = useIdentity();
  const staticDrop = selectDropForSpice(DROP, normaliseSpiceLevel(spiceLevel) as SpiceLevel);
  // Live couples see the drop the server actually assigned (rotation-aware);
  // the unauthenticated demo keeps the static content.
  const activeDrop =
    session && couple && content
      ? { ...staticDrop, code: content.code ?? staticDrop.code, title: content.title ?? staticDrop.title, prompts: content.prompts }
      : staticDrop;

  // Live sessions trust the server (relaunch-safe); the unauthenticated demo
  // falls back to the in-memory play store as before.
  const isLive = !!(session && couple);
  const revealed = isLive ? today?.state === 'revealed' : playState.done;
  const iAnswered = isLive ? !!today?.i_answered : playState.done;
  // 0035: use the real drop code from the server for honest rotation display;
  // demo falls back to the static code.
  const displayDropCode = isLive && today?.drop_code ? today.drop_code : activeDrop.code;
  // Truthful partner-presence: comes from get_today_state (SECURITY DEFINER),
  // never assumed. Only shown while it's still my turn.
  const partnerPlayed = isLive && !!today?.partner_answered && !iAnswered;
  const done = iAnswered;

  const streak = couple?.streak ?? 0;
  const wave = isLive
    ? today?.wave_pct ?? 0
    : playState.done
      ? computeReveal(playState).wave
      : 0;
  const hasUnreadActivity = unreadCount > 0;
  // Pairing pending: user is in, partner hasn't joined. They can answer ahead;
  // the reveal stays server-held (migration 0011) until the partner joins + answers.
  const isPending = couple?.status === 'pending';

  // Keep the home-screen widget in sync with server truth: realtime partner
  // events already refresh `today`, so the widget flips the moment they play.
  useEffect(() => {
    if (!isLive) return;
    syncWidgetFromToday(today, couple, partner.name);
  }, [isLive, today, couple, partner.name]);

  // 2.5 funnel: the first mutual reveal is THE activation moment. history
  // counts exactly the revealed drops, so length 1 = the first one — however
  // it happened (today's flow, a catch-up, or noticed on a later open). The
  // AsyncStorage key dedupes; requiring today.state too lost the event
  // whenever history hadn't refetched within the reveal session.
  useEffect(() => {
    if (!isLive || history.length !== 1) return;
    const KEY = `first-reveal-tracked-${couple?.id ?? ''}`;
    AsyncStorage.getItem(KEY)
      .then((seen) => {
        if (seen === '1') return;
        track(EVENTS.FIRST_MUTUAL_REVEAL);
        // D0 funnel: first mutual reveal on same day couple was created
        const ageDays = coupleAgeDays(couple?.created_at ?? null, new Date());
        if (ageDays === 0) {
          track(EVENTS.D0_MUTUAL_REVEAL);
        }
        return AsyncStorage.setItem(KEY, '1');
      })
      .catch(() => {});
  }, [isLive, history.length, couple?.id]);

  // 2.2: pending → schedule the 24/72h invite reminders once per pending
  // spell; the moment the couple goes active they're cancelled.
  useEffect(() => {
    if (!isLive) return;
    if (isPending) {
      const KEY = `pending-reminders-${couple?.id ?? ''}`;
      AsyncStorage.getItem(KEY)
        .then((set) => {
          if (set === '1') return;
          return schedulePendingReminders().then(() =>
            AsyncStorage.setItem(KEY, '1')
          );
        })
        .catch(() => {});
    } else {
      cancelPendingReminders();
    }
  }, [isLive, isPending, couple?.id]);

  // --- first-week beats (IMPROVEMENT_PLAN 2.3) -----------------------------
  const nowDate = now();
  const todayKey = localDayKey(nowDate);
  const ageDays = coupleAgeDays(couple?.created_at ?? null, nowDate);
  const beat = isLive ? firstWeekBeat(ageDays, streak) : null;
  const freezes = couple?.freezes_remaining ?? 2;

  // Days 2–6: the streak pill pulses gently, once per local day, and never
  // when the system asks for reduced motion.
  const reducedMotion = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (beat !== 'pulse' || reducedMotion) return;
    let cancelled = false;
    AsyncStorage.getItem(STREAK_PULSE_SEEN_KEY)
      .then((seen) => {
        if (cancelled || seen === todayKey) return;
        pulseScale.value = withDelay(
          700,
          withRepeat(
            withSequence(
              withTiming(1.1, { duration: 460, easing: Easing.inOut(Easing.quad) }),
              withTiming(1, { duration: 460, easing: Easing.inOut(Easing.quad) })
            ),
            2,
            false
          )
        );
        AsyncStorage.setItem(STREAK_PULSE_SEEN_KEY, todayKey).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [beat, reducedMotion, todayKey, pulseScale]);

  // --- partner-silent evening (IMPROVEMENT_PLAN 3.7) ------------------------
  // I answered, they haven't yet, and it's evening: offer solo value while the
  // reveal waits. Warm only — never guilt about the quiet side of the couple.
  const eveningWait = isLive && iAnswered && !revealed && !isPending && isEvening(nowDate);
  const hasHistory = isLive && history.length > 0;

  const [nudgedToday, setNudgedToday] = useState(false);
  useEffect(() => {
    if (!eveningWait) return;
    let cancelled = false;
    AsyncStorage.getItem(NUDGE_SENT_KEY)
      .then((sentOn) => {
        if (!cancelled && sentOn === todayKey) setNudgedToday(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eveningWait, todayKey]);

  const handleNudge = () => {
    if (!couple) return;
    // Optimistic hide: the server rate-limits (1/day) and toasts either way.
    setNudgedToday(true);
    AsyncStorage.setItem(NUDGE_SENT_KEY, todayKey).catch(() => {});
    nudge(couple.id).catch(() => {
      // already-nudged / offline — engagementActions toasted honestly.
    });
  };

  const handleOnThisDay = () => {
    router.push('/onThisDay');
  };

  const handleFirstWeek = () => {
    router.push('/wrapped');
  };

  const handleInvite = async () => {
    const code = couple?.invite_code;
    if (!code) return;
    try {
      track(EVENTS.INVITE_SHARED);
      await Share.share({
        message: `Join me on Parallax! Here's your invite code: ${code}`,
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const handlePlay = () => {
    router.push('/play');
  };

  const handleCopyCode = async () => {
    const code = couple?.invite_code;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    useUiStore.getState().fireToast('Invite code copied');
  };

  const handleReveal = () => {
    // Relaunch-safe: rehydrate the play store's coupleDropId from the server
    // state so the reveal screen can fetch the real data.
    if (isLive && today?.couple_drop_id) {
      usePlayStore.setState({ done: true, coupleDropId: today.couple_drop_id });
    }
    router.push('/reveal');
  };

  const handlePacks = () => {
    router.push('/packs');
  };

  // Journey row state: an in-progress journey shows its stage; otherwise the
  // quiet discovery entry. (Completed journeys rest in /journeys.)
  const activeJourney =
    journeyState?.exists && !journeyState.completed_at ? journeyState : null;
  const activeJourneyStageTitle = activeJourney
    ? journeyStages.find((s) => s.position === activeJourney.current_stage)?.title ?? null
    : null;

  const handleJourney = () => {
    router.push(activeJourney ? '/journey' : '/journeys');
  };

  const handleCatchUp = () => {
    router.push('/play?catchup=1');
  };

  const handleStreakPress = () => {
    router.push('/streak');
  };

  const handleActivityPress = () => {
    router.push('/activity');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, backgroundColor: colors.bg0 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          scrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: space.gutter - 4,
            paddingHorizontal: space.gutter,
            paddingBottom: 140,
          }}
        >
          {/* Header: Wordmark + Streak + Activity + Avatar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Wordmark size={25} c={colors.ink} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Streak pill — pulses gently once a day during the first week */}
              <Animated.View style={pulseStyle}>
              <Press
                onPress={handleStreakPress}
                scale={false}
                style={{ width: 'auto' }}
                accessibilityLabel={`${streak} day streak`}
                accessibilityHint="View streak details"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.line,
                    ...shadows.shadowSoft,
                  }}
                >
                  <Icon
                    d={ICONS.flame}
                    size={16}
                    color={colors.p1Deep}
                    sw={1.4}
                  />
                  <Text
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 12,
                      fontWeight: '700',
                      color: colors.ink,
                    }}
                  >
                    {streak}
                  </Text>
                </View>
              </Press>
              </Animated.View>

              {/* Activity bell with red dot */}
              <Press
                onPress={handleActivityPress}
                scale={false}
                style={{ width: 'auto' }}
                accessibilityLabel={hasUnreadActivity ? 'Activity, unread notifications' : 'Activity'}
                accessibilityHint="View recent activity"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.line,
                    ...shadows.shadowSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon d={ICONS.bell} size={18} color={colors.inkSoft} />
                  {hasUnreadActivity && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 7,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: radius.pill,
                        backgroundColor: colors.p1Deep,
                        borderWidth: 1.5,
                        borderColor: colors.surface,
                      }}
                    />
                  )}
                </View>
              </Press>

              {/* Avatar */}
              <Press
                onPress={handleProfilePress}
                scale={false}
                style={{ width: 'auto' }}
                accessibilityLabel="Your profile"
                accessibilityHint="View and edit your profile"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Tok who={{ name: me.name, initial: me.initial }} you size={36} decorative />
              </Press>
            </View>
          </View>

          {/* V2 F1: the daily temperature greeting — an inline card you scroll
              past, between the hero and the drop card (§10). Behind
              f1_mood_check; skipped on any day the couple already played. */}
          <MoodCheckCard
            coupleId={isLive ? couple!.id : null}
            userId={session?.user?.id ?? null}
            tz={couple?.tz}
            playedToday={done}
            now={now}
          />

          {/* Day 7 of the first week: celebrate, then show the real recap */}
          {beat === 'week' && (
            <Press onPress={handleFirstWeek} accessibilityLabel="See your first week">
              <LinearGradient
                colors={gradients.us.colors}
                locations={gradients.us.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 11,
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontWeight: '700',
                        color: '#fff',
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      one week of you two 🎉
                    </Text>
                    <Kick c="rgba(255,255,255,0.88)" style={{ marginTop: 3 }}>
                      see your first week →
                    </Kick>
                  </View>
                  <Icon d={ICONS.chevR} size={18} color="#fff" />
                </View>
              </LinearGradient>
            </Press>
          )}

          {/* Banner: invite CTA while pending · partner-played only when TRUE */}
          {!done && (isPending || partnerPlayed) && (
            <Press onPress={isPending ? handleInvite : handlePlay}>
              <LinearGradient
                colors={gradients.usSoft.colors}
                locations={gradients.usSoft.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 11,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(157,149,245,0.28)',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>💌</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.ink,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {isPending
                        ? 'Invite your partner to pair'
                        : `${partner.name} already played today`}
                    </Text>
                    <Kick c={colors.p2Deep} style={{ marginTop: 2 }}>
                      {isPending
                        ? "answer ahead · they'll see it when they join"
                        : 'your turn · no peeking at theirs'}
                    </Kick>
                  </View>
                  <Icon d={ICONS.chevR} size={18} color={colors.p2Deep} />
                </View>
              </LinearGradient>
            </Press>
          )}

          {/* Live cold start: hold the card with a skeleton until the REAL
              assigned drop arrives — never flash the static demo content at a
              real couple (4.1). */}
          {isLive && todayLoading && !content ? (
            <Card
              style={{
                borderRadius: radius.cardLg,
                paddingHorizontal: 18,
                paddingVertical: 20,
                gap: 12,
              }}
              testID="today-card-skeleton"
            >
              <Skeleton h={14} w="34%" />
              <Skeleton h={30} w="72%" />
              <Skeleton h={52} />
              <Skeleton h={52} />
            </Card>
          ) : (
          <Card
            style={{
              borderRadius: radius.cardLg,
              overflow: 'hidden',
              paddingHorizontal: 0,
              paddingVertical: 0,
            }}
          >
            {/* Gradient header with DROP info and floating emoji */}
            <LinearGradient
              colors={gradients.us.colors}
              locations={gradients.us.locations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 132,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Radial overlay for subtle depth (shine from top-right) */}
              <RadialGlow color="#ffffff" opacity={0.5} cx="80%" cy="-10%" r="100%" stop={0.6} />

              {/* DROP code and day */}
              <View style={{ position: 'absolute', top: 16, left: 18 }}>
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 10,
                    letterSpacing: 1.6,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {displayDropCode} · {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                </Text>
              </View>

              {/* Floating emoji (letter at bottom-right) */}
              <Float
                duration={5000}
                style={{
                  position: 'absolute',
                  right: 14,
                  bottom: -6,
                }}
              >
                <Text style={{ fontSize: 74 }}>💌</Text>
              </Float>

              {/* Title (serif italic) */}
              <View
                style={{
                  position: 'absolute',
                  left: 18,
                  bottom: 16,
                }}
              >
                <Serif s={40} italic c="#fff">
                  {activeDrop.title}
                </Serif>
              </View>
            </LinearGradient>

            {/* Content: Blurb, prompts, and CTA */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
              {!done ? (
                <>
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 22,
                      color: colors.inkSoft,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {activeDrop.blurb}
                  </Text>

                  {/* Prompt emoji tiles */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 7,
                      marginTop: 16,
                      marginBottom: 18,
                    }}
                  >
                    {activeDrop.prompts.map((p, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 52,
                          borderRadius: 16,
                          backgroundColor: colors.sunken,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.9,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                      </View>
                    ))}
                  </View>

                  <Btn
                    kind="us"
                    onPress={handlePlay}
                    sub="about 90 seconds"
                  >
                    Play today's three
                  </Btn>
                </>
              ) : isPending ? (
                <>
                  <Kick c={colors.p2Deep}>your answers are in · held</Kick>
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 23,
                      fontWeight: '600',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                      marginTop: 8,
                      marginBottom: 4,
                    }}
                  >
                    🔒 We'll score your wavelength the moment your partner joins.
                  </Text>
                  {/* Blurred partner reveal preview for D0 motivator */}
                  <View
                    style={{
                      marginTop: 14,
                      marginBottom: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: colors.sunken,
                      borderWidth: 1.5,
                      borderColor: 'rgba(157,149,245,0.24)',
                    }}
                  >
                    <Kick c={colors.p2Deep} style={{ marginBottom: 10 }}>
                      your first reveal
                    </Kick>
                    <Text
                      style={{
                        fontSize: 14.5,
                        lineHeight: 21,
                        color: colors.ink,
                        fontFamily: fontFamily.ui,
                        marginBottom: 10,
                      }}
                    >
                      This is where {partner.name}'s answers land.
                    </Text>
                    <View
                      style={{
                        height: 72,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <BlurView experimentalBlurMethod="dimezisBlurView" intensity={80} style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.inkMute,
                            fontFamily: fontFamily.ui,
                            textAlign: 'center',
                          }}
                        >
                          🔒 Locked
                        </Text>
                      </BlurView>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        lineHeight: 18,
                        color: colors.inkSoft,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      Invite them to unlock your first reveal.
                    </Text>
                  </View>
                  {couple?.invite_code ? (
                    <Press
                      onPress={handleCopyCode}
                      scale={false}
                      accessibilityLabel="Copy invite code"
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 12,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 14,
                          backgroundColor: colors.sunken,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fontFamily.mono,
                            fontSize: 15,
                            fontWeight: '700',
                            letterSpacing: 2,
                            color: colors.ink,
                          }}
                        >
                          {couple.invite_code}
                        </Text>
                        <Kick c={colors.p2Deep}>tap to copy</Kick>
                      </View>
                    </Press>
                  ) : null}
                  <View style={{ marginTop: 12 }}>
                    <Btn kind="us" onPress={handleInvite} sub="share your invite">
                      Invite your partner →
                    </Btn>
                  </View>
                </>
              ) : !revealed ? (
                <>
                  <Kick c={colors.p2Deep}>your answers are in ✓</Kick>
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 23,
                      fontWeight: '600',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                      marginTop: 8,
                      marginBottom: 4,
                    }}
                  >
                    Waiting on {partner.name} — the reveal unlocks the moment they play.
                  </Text>
                  {eveningWait && (
                    <View style={{ marginTop: 14, gap: 8 }}>
                      <Kick c={colors.inkMute}>while you wait</Kick>
                      {hasHistory && (
                        <Press
                          onPress={handleOnThisDay}
                          scale={false}
                          accessibilityLabel="Revisit a favorite reveal"
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 10,
                              paddingVertical: 11,
                              paddingHorizontal: 13,
                              borderRadius: 14,
                              backgroundColor: colors.sunken,
                            }}
                          >
                            <Text style={{ fontSize: 19 }}>💫</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: '700',
                                  color: colors.ink,
                                  fontFamily: fontFamily.ui,
                                }}
                              >
                                remember this one?
                              </Text>
                              <Kick style={{ marginTop: 3 }}>
                                revisit a favorite reveal from your story
                              </Kick>
                            </View>
                            <Icon d={ICONS.chevR} size={16} color={colors.inkMute} />
                          </View>
                        </Press>
                      )}
                      {!nudgedToday && (
                        <Press
                          onPress={handleNudge}
                          scale={false}
                          accessibilityLabel={`Send ${partner.name} a nudge`}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 10,
                              paddingVertical: 11,
                              paddingHorizontal: 13,
                              borderRadius: 14,
                              backgroundColor: colors.sunken,
                            }}
                          >
                            <Text style={{ fontSize: 19 }}>👋</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: '700',
                                  color: colors.ink,
                                  fontFamily: fontFamily.ui,
                                }}
                              >
                                send {partner.name} a nudge
                              </Text>
                              <Kick style={{ marginTop: 3 }}>
                                a soft hello — zero pressure
                              </Kick>
                            </View>
                            <Icon d={ICONS.chevR} size={16} color={colors.inkMute} />
                          </View>
                        </Press>
                      )}
                      {hasHistory && (
                        <Press
                          onPress={() => router.push('/practice')}
                          scale={false}
                          accessibilityLabel={`Practice reading ${partner.name}`}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 10,
                              paddingVertical: 11,
                              paddingHorizontal: 13,
                              borderRadius: 14,
                              backgroundColor: colors.sunken,
                            }}
                          >
                            <Text style={{ fontSize: 19 }}>🎯</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: '700',
                                  color: colors.ink,
                                  fontFamily: fontFamily.ui,
                                }}
                              >
                                practice reading {partner.name} 🎯
                              </Text>
                              <Kick style={{ marginTop: 3 }}>
                                guess their past answers · nothing is sent
                              </Kick>
                            </View>
                            <Icon d={ICONS.chevR} size={16} color={colors.inkMute} />
                          </View>
                        </Press>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Revealed teaser: lead with the story, not the grade
                      (STRATEGY §4.3). The wave% stays, demoted to a supporting
                      line; the full round narrative lives on the reveal. */}
                  <Kick c={colors.matchDeep}>
                    round complete · you both played
                  </Kick>
                  <Serif
                    s={26}
                    italic
                    c={colors.ink}
                    style={{ marginTop: 8, marginBottom: 4 }}
                  >
                    see how you read each other
                  </Serif>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 7,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 11,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: colors.inkMute,
                      }}
                    >
                      wavelength
                    </Text>
                    <GradientText
                      style={{
                        fontFamily: fontFamily.disp,
                        fontSize: 24,
                        lineHeight: 26,
                        paddingRight: 2,
                      }}
                    >
                      {`${wave}%`}
                    </GradientText>
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <Btn
                      kind="ink"
                      onPress={handleReveal}
                      sub="the good part"
                    >
                      See the reveal →
                    </Btn>
                  </View>
                </>
              )}
            </View>
          </Card>
          )}

          {/* Catch-up (0021): yesterday slipped — one bad day ≠ death. Warm,
              never guilt; the 80% rule is stated up front. */}
          {isLive && today?.catch_up_available && (
            <Press onPress={handleCatchUp} accessibilityLabel="Catch up on yesterday's drop">
              <Card
                style={{
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    backgroundColor: colors.sunken,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🌙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Yesterday got away? Catch it up
                  </Text>
                  <Kick style={{ marginTop: 3 }}>
                    open till midnight · scored at 80% · saves your streak
                  </Kick>
                </View>
                <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
              </Card>
            </Press>
          )}

          {/* Day 1: the streak rule in one quiet sentence (Duolingo's lesson) */}
          {streak === 1 && (
            <Text
              style={{
                marginTop: 10,
                fontSize: 12.5,
                lineHeight: 18,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
              }}
            >
              streak rule: you both play, it grows. miss a day? catch it up by
              midnight, or a freeze saves you — you have {freezes}.
            </Text>
          )}

          {/* Send a pack row */}
          <Press onPress={handlePacks}>
            <Card
              style={{
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  backgroundColor: colors.sunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon d={ICONS.cards} size={20} color={colors.inkSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Send {partner.name} a pack
                </Text>
                <Kick style={{ marginTop: 3 }}>
                  themed drops · deep, spicy, silly & more
                </Kick>
              </View>
              <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
            </Card>
          </Press>

          {/* Milestone journey row (0028): in progress → stage marker; none →
              quiet discovery. Same register as the pack row — never a shout. */}
          <Press
            onPress={handleJourney}
            accessibilityLabel={
              activeJourney ? 'Open your journey' : 'Browse milestone journeys'
            }
          >
            <Card
              style={{
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  backgroundColor: colors.sunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>
                  {activeJourney ? activeJourney.emoji ?? '🧭' : '🧭'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {activeJourney ? activeJourney.title : 'Milestone journeys'}
                </Text>
                <Kick style={{ marginTop: 3 }}>
                  {activeJourney
                    ? `${stageProgressLabel(
                        activeJourney.current_stage ?? 1,
                        activeJourney.stage_count ?? 0,
                        false
                      )}${activeJourneyStageTitle ? ` · ${activeJourneyStageTitle}` : ''}`
                    : 'the bto journey is here · walk the big eras together'}
                </Kick>
              </View>
              <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
            </Card>
          </Press>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
