import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  Text,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DawnBlobs } from '../../src/components/DawnBlobs';
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
import { useCouple } from '../../src/features/pairing/useCouple';
import { useActivity } from '../../src/features/engagement/useActivity';
import { useSession } from '../../src/features/auth/useSession';

// Identity definitions
const YOU = { name: 'you', initial: 'Y' };
const PAR = { name: 'Dani', initial: 'D' };

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const playState = usePlayStore();
  const done = playState.done;
  const reveal = done ? computeReveal(playState) : null;
  const { session } = useSession();
  const { couple } = useCouple();
  const { items: dbActivity, unreadCount } = useActivity(couple?.id || null);

  const streak = couple?.streak ?? 23;
  const wave = reveal?.wave ?? 76;
  const hasUnreadActivity = unreadCount > 0;

  const handlePlay = () => {
    router.push('/play');
  };

  const handleReveal = () => {
    router.push('/reveal');
  };

  const handlePacks = () => {
    router.push('/packs');
  };

  const handleStreakPress = () => {
    // Would open streak widget
  };

  const handleActivityPress = () => {
    // Would open activity panel
  };

  const handleProfilePress = () => {
    // Would open profile
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
              >
                <Tok who={YOU} you size={36} />
              </Press>
            </View>
          </View>

          {/* Partner ping banner (show when not done) */}
          {!done && (
            <Press onPress={handlePlay}>
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
                      Dani already played today
                    </Text>
                    <Kick c={colors.p2Deep} style={{ marginTop: 2 }}>
                      your turn · no peeking at theirs
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
                  {DROP.code} · {DROP.day.toUpperCase()}
                </Text>
              </View>

              {/* Floating emoji (letter at bottom-right) */}
              <View
                style={{
                  position: 'absolute',
                  right: 14,
                  bottom: -6,
                }}
              >
                <Text style={{ fontSize: 74 }}>💌</Text>
              </View>

              {/* Title (serif italic) */}
              <View
                style={{
                  position: 'absolute',
                  left: 18,
                  bottom: 16,
                }}
              >
                <Serif s={40} italic c="#fff">
                  {DROP.title}
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
                    {DROP.blurb}
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
                    {DROP.prompts.map((p, i) => (
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
                  Send Dani a pack
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
