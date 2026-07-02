import React from 'react';
import {
  View,
  ScrollView,
  Text,
  Share,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, gradients, radius, shadows, space } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { DROP } from '../../src/content/drop';
import { usePlayStore, computeReveal } from '../../src/store/play';
import { useTodayState } from '../../src/features/drops/useTodayState';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useActivity } from '../../src/features/engagement/useActivity';
import { useSession } from '../../src/features/auth/useSession';
import { useProfile } from '../../src/features/profile/useProfile';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { selectDropForSpice, normaliseSpiceLevel } from '../../src/domain/spice';
import type { SpiceLevel } from '../../src/domain/spice';

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const playState = usePlayStore();
  const { session } = useSession();
  const { couple } = useCouple();
  const { today, content } = useTodayState(session && couple ? couple.id : null);
  const { items: dbActivity, unreadCount } = useActivity(couple?.id || null);
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

  const handleInvite = async () => {
    const code = couple?.invite_code;
    if (!code) return;
    try {
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
              {/* Streak pill */}
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

          {/* Today's drop card */}
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
                  {activeDrop.code} · {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
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
                  <View style={{ marginTop: 16 }}>
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
                </>
              ) : (
                <>
                  <Kick c={colors.matchDeep}>
                    round complete · you both played
                  </Kick>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 10,
                      marginTop: 8,
                      marginBottom: 4,
                    }}
                  >
                    <GradientText
                      style={{
                        fontFamily: fontFamily.disp,
                        fontSize: 52,
                        lineHeight: 57,
                        paddingRight: 2,
                      }}
                    >
                      {`${wave}%`}
                    </GradientText>
                    <Text
                      style={{
                        fontSize: 15,
                        lineHeight: 18,
                        fontWeight: '600',
                        color: colors.inkSoft,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      on the same wavelength
                    </Text>
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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
