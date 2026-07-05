import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../src/components/TopBar';
import Press from '../src/components/Press';
import { Kick, Serif } from '../src/components/Text';
import GradientText from '../src/components/GradientText';
import { Float } from '../src/components/Float';
import { RadialGlow } from '../src/components/RadialGlow';
import Tok from '../src/components/Tok';
import { Icon, ICONS } from '../src/components/Icon';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { MILES } from '../src/content/us';
import { supabase } from '../src/lib/supabase';
import type { Couple, StreakSurface } from '../src/types/db';
import { useCouple } from '../src/features/pairing/useCouple';
import { useIdentity } from '../src/features/profile/useIdentity';
import { usePurchases } from '../src/features/purchases/usePurchases';
import Btn from '../src/components/Btn';
import Toast from '../src/components/Toast';

// 0021 records what reset_stale_streaks killed (repairable for 7 days); the
// hand-written Couple type doesn't carry the columns yet.
type CoupleWithLapse = Couple & {
  lapsed_streak?: number | null;
  lapsed_on?: string | null;
};

export default function StreakScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { couple } = useCouple();
  const { me, partner } = useIdentity();
  const isPro = usePurchases((s) => s.isPro);
  const [surface, setSurface] = useState<StreakSurface | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [surfaceError, setSurfaceError] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repaired, setRepaired] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!couple?.id) {
      setSurface(null);
      return;
    }
    let cancelled = false;
    (async () => {
      // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
      const { data, error } = await supabase.rpc('get_streak_surface', {
        p_couple: couple.id,
      });
      if (cancelled) return;
      // The couple-row fallback numbers stay up (never a blank screen), but a
      // failed live fetch is SAID, with a retry — the week grid may be stale.
      if (error || !data) {
        setSurfaceError(true);
        return;
      }
      setSurfaceError(false);
      setSurface(data as StreakSurface);
    })();
    return () => {
      cancelled = true;
    };
  }, [couple?.id, reloadKey]);

  const streak = surface?.streak ?? couple?.streak ?? 0;
  // Server truth: get_streak_surface.week is the real last-7-days history,
  // oldest first (index 6 = today). GATE: the unauthenticated demo (no couple)
  // keeps the old synthetic fill from the streak count.
  const week =
    surface?.week ?? Array.from({ length: 7 }, (_, i) => i >= 7 - Math.min(streak, 7));
  const longest = surface?.longest_streak ?? couple?.longest_streak ?? streak;
  const freezes = surface?.freezes_remaining ?? couple?.freezes_remaining ?? 2;
  const next = MILES.find((m) => m > streak) || 365;
  const prevM = [0, ...MILES].reverse().find((m) => m <= streak) || 0;
  const prog = next === prevM ? 1 : Math.min(1, (streak - prevM) / (next - prevM));

  // 5.3: a lapsed streak is repairable (server enforces the 7-day window;
  // the same check here keeps the card honest — offering a repair the server
  // will refuse is a lie). Hidden when nothing lapsed; Plus repairs free;
  // non-Plus sees the paywall first — never a silent repair.
  const lapsedStreak = (couple as CoupleWithLapse | null)?.lapsed_streak ?? 0;
  const lapsedOn = (couple as CoupleWithLapse | null)?.lapsed_on ?? null;
  const lapsedRecently =
    !!lapsedOn && (Date.now() - new Date(lapsedOn).getTime()) / 86400000 <= 7;
  const showRepair =
    !!couple?.id && !repaired && streak === 0 && lapsedStreak > 0 && lapsedRecently;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleRepair = async () => {
    if (!couple?.id || repairing) return;
    if (!isPro) {
      router.push('/(sheets)/plus');
      return;
    }
    setRepairing(true);
    try {
      // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
      const { error } = await supabase.rpc('repair_streak', {
        p_couple: couple.id,
      });
      if (error) throw error;
      setRepaired(true);
      setReloadKey((k) => k + 1);
      showToast(`streak repaired — ${lapsedStreak} days back`);
    } catch {
      showToast("Couldn't repair the streak — try again.");
    } finally {
      setRepairing(false);
    }
  };

  const handleBack = () => safeBack(router);

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
          <Float distance={7} duration={4000}>
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
              <RadialGlow color="#FF8E7A" opacity={0.32} r="50%" stop={0.65} />
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
          <Kick style={{ marginTop: 6 }}>day of showing up together</Kick>

          {/* Both faces */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 14,
            alignItems: 'center',
          }}>
            <Tok who={{ initial: me.initial }} you size={34} ring />
            <View style={{ marginLeft: -10 }}>
              <Tok who={{ initial: partner.initial, name: partner.name }} size={34} ring />
            </View>
          </View>
        </View>

        {/* Mutual accountability card (us-soft) */}
        <View
          style={{
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
            borderRadius: 22,
            paddingVertical: 15,
            paddingHorizontal: 16,
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

        {/* Streak repair (only when a streak actually lapsed) */}
        {showRepair && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 22,
              padding: 16,
              marginBottom: 22,
              ...shadows.shadowSoft,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,142,122,0.16)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>🩹</Text>
              </View>
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
                  Bring your streak back
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
                  {`You had a ${lapsedStreak}-day streak. Bring it back within 7 days — it's rest, not a reset.`}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              {isPro ? (
                <Btn kind="us" onPress={handleRepair} disabled={repairing}>
                  {repairing ? 'Repairing…' : 'Repair it — free with Plus'}
                </Btn>
              ) : (
                <Btn kind="us" onPress={handleRepair}>
                  Repair with Plus
                </Btn>
              )}
            </View>
          </View>
        )}

        {/* Live surface failed: the fallback numbers stay, but say so (4.1) */}
        {surfaceError && (
          <Press
            onPress={() => setReloadKey((k) => k + 1)}
            scale={false}
            accessibilityLabel="Retry loading live streak"
          >
            <View
              style={{
                marginTop: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: colors.sunken,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text allowFontScaling={false} style={{ fontSize: 15 }}>🌫</Text>
              <Text
                allowFontScaling={false}
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  lineHeight: 17.5,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                live numbers didn't load — this may be a beat behind
              </Text>
              <Kick c={colors.p2Deep}>try again</Kick>
            </View>
          </Press>
        )}

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
                testID={`week-dot-${idx}-${week[idx] ? 'filled' : 'empty'}`}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.pill,
                  backgroundColor: week[idx] ? undefined : colors.sunken,
                  borderWidth: idx === 6 ? 1.5 : 0,
                  borderColor: idx === 6 ? colors.p1 : 'transparent',
                  borderStyle: idx === 6 ? 'dashed' : 'solid',
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {week[idx] && (
                  <LinearGradient
                    colors={gradients.us.colors}
                    locations={gradients.us.locations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', inset: 0 }}
                  />
                )}
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
          show up to light it up
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
            paddingVertical: 18,
            paddingHorizontal: 16,
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
            <LinearGradient
              colors={gradients.us.colors}
              locations={gradients.us.locations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${prog * 100}%`,
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
                        ? undefined
                        : isNext
                        ? colors.surface
                        : colors.sunken,
                      borderWidth: isNext ? 2 : 0,
                      borderColor: isNext ? colors.p2 : 'transparent',
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                      ...(hit ? shadows.shadowSoft : {}),
                    }}
                  >
                    {hit && (
                      <LinearGradient
                        colors={gradients.us.colors}
                        locations={gradients.us.locations}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', inset: 0 }}
                      />
                    )}
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
              Streak freeze · {freezes} equipped
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
              Auto-used when life gets busy. Gives you both grace — no judgment, no reset. Earn one back every 7 days (max 2).
            </Text>
          </View>
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
          {`longest streak together · ${longest} days`}
        </Text>
      </ScrollView>

      {toastMsg && <Toast msg={toastMsg} />}
    </View>
  );
}
