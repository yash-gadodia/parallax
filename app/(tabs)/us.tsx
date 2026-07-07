import React from 'react';
import {
  View,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { DawnBlobs } from '../../src/components/DawnBlobs';
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
import { ARCHIVE } from '../../src/content/drop';
import { useLearnings } from '../../src/features/lovemap/useLearnings';
import { useCoupleHistory } from '../../src/features/lovemap/useCoupleHistory';
import { useDropEmojis } from '../../src/features/history/useDropEmojis';
import { useProfile } from '../../src/features/profile/useProfile';
import { useMoneyDate } from '../../src/features/moneyDates/useMoneyDate';
import { describeLastMoneyDate } from '../../src/features/moneyDates/cards';
import { useRefetchOnRefocus } from '../../src/lib/useRefetchOnRefocus';
import { GrowthCounter } from '../../src/features/growth/GrowthCounter';

export default function UsScreen() {
  const router = useRouter();
  const { items: learningItems, isSample: learningsSample } = useLearnings();
  const {
    history,
    isSample: historySample,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useCoupleHistory();
  // Real drops carry their emoji in the DB (first prompt); the static ARCHIVE
  // only covers the demo codes, so it stays as the demo fallback below.
  const dropEmojis = useDropEmojis(history.map((h) => h.code));
  const { name, partnerName, streak, togetherSince } = useProfile();
  const { state: moneyDateState, refetch: refetchMoneyDate } = useMoneyDate();
  // The money-date row goes stale after a session completes on the pushed
  // screen — refresh it whenever the tab regains focus.
  useRefetchOnRefocus(refetchMoneyDate);

  const currentWave = history.length > 0 ? `${history[0].wavelength}` : null;

  // Trend vs the previous drop — only shown when there are two real data points.
  const trendDelta =
    history.length >= 2 ? history[0].wavelength - history[1].wavelength : null;

  // Wavelength bar chart: built only from real history (most recent rendered as current).
  const hist: number[] = history.slice(0, 7).reverse().map((h) => h.wavelength);

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleWrappedPress = () => {
    router.push('/wrapped');
  };

  const handleLoveMapPress = () => {
    router.push('/lovemap');
  };

  const handleStreakPress = () => {
    router.push('/streak');
  };

  // Real history rows carry couple_drop_id (0024) so the detail screen renders
  // the REAL drop; the demo sample rows have no id and fall back to ARCHIVE.
  const handleDropPress = (h: { code: string; couple_drop_id?: string; date?: string }) => {
    if (!historySample && h.couple_drop_id) {
      router.push(
        `/dropDetail?code=${h.code}&cdid=${h.couple_drop_id}&day=${encodeURIComponent(h.date ?? '')}`
      );
    } else {
      router.push(`/dropDetail?code=${h.code}`);
    }
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
            paddingTop: space.gutter - 16,
            paddingHorizontal: space.gutter,
            paddingBottom: 140,
          }}
        >
          {/* Settings gear (top-right) */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
            <Press
              onPress={handleProfilePress}
              scale={false}
              style={{ width: 'auto' }}
              accessibilityLabel="Profile and settings"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                <Icon d={ICONS.gear} size={19} color={colors.inkSoft} />
              </View>
            </Press>
          </View>

          {/* Couple avatars + name + streak */}
          <View
            style={{
              alignItems: 'center',
              marginTop: 2,
              marginBottom: 8,
            }}
          >
            {/* Overlapping avatars */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 14,
                alignItems: 'center',
              }}
            >
              <Tok who={{ initial: (name[0] || 'Y').toUpperCase() }} you size={62} ring />
              <View style={{ marginLeft: -18 }}>
                <Tok who={{ initial: (partnerName[0] || 'D').toUpperCase() }} size={62} ring />
              </View>
            </View>

            {/* Couple name (serif italic) */}
            <Serif s={34} italic>
              {`${name} & ${partnerName}`}
            </Serif>

            {/* Together since + streak */}
            <Press
              onPress={handleStreakPress}
              scale={false}
              style={{ width: 'auto', marginTop: 8 }}
              accessibilityLabel={`${streak} day streak, view details`}
            >
              <Kick>
                {`${togetherSince ? `together since ${togetherSince.toLowerCase().split(' ')[0]} · ` : ''}${streak} day streak 🔥`}
              </Kick>
            </Press>
          </View>

          {/* V2 F5: growth counter — the one hero stat, above Wrapped (§10).
              Behind f5_growth_counter; sample data never counts. */}
          {!learningsSample && (
            <GrowthCounter
              count={learningItems.length}
              privateCount={learningItems.filter((l) => l.is_private).length}
            />
          )}

          {/* Wrapped hero card */}
          {history.length > 0 && (
            <Press onPress={handleWrappedPress} accessibilityLabel="Your month, wrapped — June recap">
              <View
                style={{
                  borderRadius: 26,
                  overflow: 'hidden',
                  marginTop: 18,
                  ...shadows.shadow,
                }}
              >
                <LinearGradient
                  colors={gradients.us.colors}
                  locations={gradients.us.locations}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    position: 'relative',
                  }}
                >
                  {/* Radial overlay for depth */}
                  <View
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  />

                  {/* Gift emoji */}
                  <Text style={{ fontSize: 38, zIndex: 1 }}>🎁</Text>

                  {/* Text content */}
                  <View style={{ flex: 1, zIndex: 1 }}>
                    <Kick c="rgba(255,255,255,0.85)">new · june recap</Kick>
                    <Serif s={28} c="#fff" style={{ marginTop: 2 }}>
                      Your month, wrapped
                    </Serif>
                    <Text
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.92)',
                        marginTop: 3,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      find out your couple type →
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </Press>
          )}

          {/* Love Map card */}
          <Press onPress={handleLoveMapPress} accessibilityLabel="Your Love Map">
            <Card
              style={{
                borderRadius: 26,
                paddingHorizontal: 18,
                paddingVertical: 18,
                marginTop: 14,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 24 }}>🗺️</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    Your Love Map
                  </Text>
                  <Kick style={{ marginTop: 2 }}>
                    {learningItems.length} things you're learning
                  </Kick>
                </View>
                <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
              </View>

              {/* First 2 learnings preview */}
              <View style={{ flexDirection: 'column', gap: 9 }}>
                {learningItems.slice(0, 2).map((l) => {
                  const isYou = l.about === 'you';
                  return (
                    <View
                      key={l.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 13,
                        paddingVertical: 11,
                        borderRadius: 14,
                        backgroundColor: isYou
                          ? 'rgba(255,142,122,0.08)'
                          : 'rgba(157,149,245,0.09)',
                        borderLeftWidth: 3,
                        borderLeftColor: isYou ? colors.p1 : colors.p2,
                      }}
                    >
                      <Text style={{ fontSize: 17 }}>{l.emoji}</Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 13.5,
                          fontWeight: '600',
                          lineHeight: 19,
                          color: colors.ink,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        {l.need}
                      </Text>
                      {l.source === 'refocus' && (
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '700',
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: colors.p2Deep,
                            backgroundColor: 'rgba(157,149,245,0.16)',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: radius.pill,
                            fontFamily: fontFamily.mono,
                          }}
                        >
                          FROM A FIGHT
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          </Press>

          {/* Money Date row — the guided money conversation (0029) */}
          <Press onPress={() => router.push('/moneyDate')} accessibilityLabel="Money Date">
            <Card
              style={{
                borderRadius: 26,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 24 }}>☕</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  Money Date
                </Text>
                <Kick style={{ marginTop: 2 }}>
                  {describeLastMoneyDate(moneyDateState?.last_completed_at ?? null)}
                </Kick>
              </View>
              <Icon d={ICONS.chevR} size={18} color={colors.inkMute} />
            </Card>
          </Press>

          {historyLoading ? (
            /* Skeleton: the chart card, stat trio and first history rows keep
               their shape while the real story loads — never a blank pop-in. */
            <View style={{ marginTop: 18 }}>
              <Skeleton h={196} br={26} testID="us-skeleton-chart" />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} h={92} br={20} testID="us-skeleton-stat" style={{ flex: 1 }} />
                ))}
              </View>
              <View style={{ marginTop: 24, gap: 10 }}>
                <Skeleton h={70} br={20} testID="us-skeleton-row-1" />
                <Skeleton h={70} br={20} testID="us-skeleton-row-2" />
              </View>
            </View>
          ) : historyError ? (
            <Card
              style={{
                borderRadius: 26,
                paddingHorizontal: 18,
                paddingVertical: 20,
                marginTop: 18,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 30 }}>🫧</Text>
              <Serif s={22} style={{ marginTop: 8, textAlign: 'center' }}>
                hmm, that didn't load
              </Serif>
              <Text
                style={{
                  fontSize: 13.5,
                  lineHeight: 13.5 * 1.45,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                  marginTop: 6,
                  marginBottom: 14,
                }}
              >
                {`your story with ${partnerName} is safe — we just couldn't reach it.`}
              </Text>
              <Btn kind="soft" onPress={refetchHistory} style={{ alignSelf: 'stretch' }}>
                try again
              </Btn>
            </Card>
          ) : history.length > 0 ? (
          <>
          {/* Wavelength card with chart */}
          <Card
            style={{
              borderRadius: 26,
              paddingHorizontal: 18,
              paddingVertical: 20,
              marginTop: 18,
            }}
          >
            {/* Header */}
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 16,
              }}
            >
              <View>
                <Kick c={colors.inkMute}>wavelength · this month</Kick>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <GradientText
                    style={{
                      fontFamily: fontFamily.disp,
                      fontSize: 40,
                      lineHeight: 44,
                      paddingRight: 2.4,
                    }}
                  >
                    {`${currentWave}%`}
                  </GradientText>
                  {trendDelta !== null && trendDelta !== 0 && (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: trendDelta > 0 ? colors.matchDeep : colors.p1Deep,
                        fontFamily: fontFamily.mono,
                        letterSpacing: 0,
                      }}
                    >
                      {`${trendDelta > 0 ? '▲' : '▼'} ${Math.abs(trendDelta)}%`}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Bar chart (last 7 + current) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 7,
                height: 90,
              }}
            >
              {hist.map((h, i) => {
                const isLast = i === hist.length - 1;
                return isLast ? (
                  <LinearGradient
                    key={i}
                    colors={gradients.us.colors}
                    locations={gradients.us.locations}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: 8,
                      backgroundColor: colors.sunken,
                    }}
                  />
                );
              })}
            </View>

            {/* Chart label */}
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: colors.inkMute,
                textAlign: 'right',
                marginTop: 8,
                fontFamily: fontFamily.mono,
              }}
            >
              LAST 7 DROPS
            </Text>
          </Card>

          {/* Stats trio — answered = history * 3 prompts; twins = sum of twins_count */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            {[
              { big: String(history.length * 3), label: 'answered' },
              { big: String(history.reduce((acc, h) => acc + (h.twins_count || 0), 0)), label: 'twin moments' },
              { big: String(history.length), label: 'drops played' },
            ].map((stat, i) => (
              <Card
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Serif s={26}>{stat.big}</Serif>
                <Kick style={{ marginTop: 5 }}>{stat.label}</Kick>
              </Card>
            ))}
          </View>
          </>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 8, paddingHorizontal: 20 }}>
              <Kick c={colors.inkMute}>YOUR STORY STARTS HERE</Kick>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {`Your wavelength with ${partnerName} shows up after your first reveal.`}
              </Text>
            </View>
          )}

          {/* Drop history (only once there's a story to list) */}
          {history.length > 0 && (
          <>
          <View
            style={{
              marginTop: 24,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Kick>your drop history</Kick>
            <Press
              onPress={() => router.push('/timeline')}
              scale={false}
              style={{ width: 'auto' }}
              accessibilityLabel="See your whole story"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Kick c={colors.p2Deep}>see your whole story →</Kick>
            </Press>
          </View>

          <View style={{ flexDirection: 'column', gap: 10 }}>
            {history.map((h) => {
              // Real emoji from the drops data first; ARCHIVE covers the demo
              // sample; 💬 is the honest unknown.
              const emoji =
                dropEmojis[h.code] ??
                ARCHIVE.find((a) => a.code === h.code)?.emoji ??
                '💬';
              return (
                <Press key={h.code} onPress={() => handleDropPress(h)}>
                  <Card
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 15,
                      paddingVertical: 13,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 13,
                    }}
                  >
                    {/* Emoji icon */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: colors.sunken,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </View>

                    {/* Title + code/day */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: colors.ink,
                          fontFamily: fontFamily.disp,
                        }}
                      >
                        {h.title}
                      </Text>
                      <Kick style={{ marginTop: 3 }}>
                        {h.code} · {h.date}
                      </Kick>
                    </View>

                    {/* Wave % + twins count (right side) */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <GradientText
                        style={{
                          fontFamily: fontFamily.disp,
                          fontSize: 22,
                          lineHeight: 24,
                          textAlign: 'right',
                        }}
                      >
                        {`${h.wavelength}%`}
                      </GradientText>
                      <Kick style={{ marginTop: 2 }}>
                        {h.twins_count} 👯
                      </Kick>
                    </View>

                    {/* Chevron */}
                    <Icon d={ICONS.chevR} size={17} color={colors.inkMute} />
                  </Card>
                </Press>
              );
            })}
          </View>
          </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
