import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";
import { BlurView } from 'expo-blur';
import { gradients } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import { useIdentity } from '../src/features/profile/useIdentity';
import { useCouple } from '../src/features/pairing/useCouple';
import { useCoupleHistory } from '../src/features/lovemap/useCoupleHistory';
import {
  monthStats,
  monthLabel,
  monthName,
  monthShort,
  dayLabel,
  weeklyDots,
  yearStats,
  archetypeFor,
  MIN_DROPS_FOR_YEAR_WRAPPED,
} from '../src/features/history/historyStats';

// A couple needs this many revealed drops in the month for a recap to mean
// anything — below it, Wrapped shows the warm not-yet state instead.
const MIN_DROPS_FOR_WRAPPED = 5;

interface Slide {
  kind: 'cover' | 'stat' | 'curve' | 'archetype' | 'share';
  bg: readonly [string, string, ...string[]];
  kicker?: string;
  big?: string;
  unit?: string;
  sub?: string;
}

export default function WrappedScreen() {
  const router = useRouter();
  const { me, partner } = useIdentity();
  const { couple } = useCouple();
  const { history, loading, error, refetch } = useCoupleHistory();
  const [slideIdx, setSlideIdx] = useState(0);
  const [range, setRange] = useState<'month' | 'year'>('month');
  const barAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    barAnim.setValue(0);
    RNAnimated.timing(barAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [slideIdx, barAnim]);

  const now = new Date();
  const month = monthLabel(now);
  const year = now.getFullYear();
  const yy = String(year).slice(-2);
  const stats = monthStats(history, now);
  const yStats = yearStats(history, year);
  const archetype = archetypeFor(yStats);
  const isYear = range === 'year';
  const streak = couple?.streak ?? 0;

  const handleClose = () => {
    safeBack(router);
  };

  const handleToggleRange = () => {
    setRange(isYear ? 'month' : 'year');
    setSlideIdx(0);
  };

  const handleShare = () => {
    router.push('/(sheets)/share');
  };

  // Every slide is computed from the couple's real month (or real year) — no
  // canned numbers, and the annual archetype is derived purely from their own
  // patterns. Slides without a real data source simply don't exist.
  const yearSlides: Slide[] = [
    { kind: 'cover', bg: ['#FF8E7A', '#9D95F5'] },
    {
      kind: 'stat',
      bg: ['#7064E6', '#C387C9'],
      kicker: 'you showed up',
      big: String(yStats.count),
      unit: 'drops, together',
      sub: `that's ${yStats.count} drops revealed in ${year}.`,
    },
    ...(yStats.avgWave != null
      ? [
          {
            kind: 'stat',
            bg: ['#54C2A0', '#9D95F5'],
            kicker: 'in sync',
            big: `${yStats.avgWave}%`,
            unit: 'average wavelength',
            sub: 'your real average, across every reveal this year.',
          } as Slide,
        ]
      : []),
    ...(yStats.curve.length > 1
      ? [
          {
            kind: 'curve',
            bg: ['#EF6A53', '#C387C9'],
            kicker: 'month by month',
            sub: 'your average wavelength, every month you played.',
          } as Slide,
        ]
      : []),
    ...(yStats.bestMonth
      ? [
          {
            kind: 'stat',
            bg: gradients.us.colors,
            kicker: 'peak telepathy',
            big: `${yStats.bestMonth.avg}%`,
            unit: monthName(yStats.bestMonth.month),
            sub: `${yStats.bestMonth.count} drops at ${yStats.bestMonth.avg}% average — your closest month of ${year}.`,
          } as Slide,
        ]
      : []),
    ...(archetype
      ? [
          {
            kind: 'archetype',
            bg: ['#7064E6', '#C387C9'],
            kicker: 'your year had a shape',
            big: archetype.name,
            sub: archetype.line,
          } as Slide,
        ]
      : []),
    { kind: 'share', bg: ['#9D95F5', '#FF8E7A'] },
  ];

  const monthSlides: Slide[] = [
    { kind: 'cover', bg: ['#FF8E7A', '#9D95F5'] },
    {
      kind: 'stat',
      bg: ['#7064E6', '#C387C9'],
      kicker: 'you showed up',
      big: String(stats.count),
      unit: 'drops, together',
      sub: `that's ${stats.count} drops revealed this month.`,
    },
    ...(stats.avgWave != null
      ? [
          {
            kind: 'stat',
            bg: ['#54C2A0', '#9D95F5'],
            kicker: 'in sync',
            big: `${stats.avgWave}%`,
            unit: 'average wavelength',
            sub: 'your real average, across every reveal this month.',
          } as Slide,
        ]
      : []),
    ...(stats.best
      ? [
          {
            kind: 'stat',
            bg: ['#EF6A53', '#C387C9'],
            kicker: 'your best day',
            big: `${stats.best.wavelength}%`,
            unit: stats.best.title,
            sub: `${dayLabel(stats.best.date)} — your highest wavelength this month.`,
          } as Slide,
        ]
      : []),
    ...(streak > 0
      ? [
          {
            kind: 'stat',
            bg: gradients.us.colors,
            kicker: 'still going',
            big: String(streak),
            unit: 'day streak',
            sub: 'kept alive by the both of you.',
          } as Slide,
        ]
      : []),
    { kind: 'share', bg: ['#9D95F5', '#FF8E7A'] },
  ];

  const slides = isYear ? yearSlides : monthSlides;
  const slide = slides[Math.min(slideIdx, slides.length - 1)];
  const isLastSlide = slideIdx >= slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      safeBack(router);
    } else {
      setSlideIdx(slideIdx + 1);
    }
  };

  const handlePrev = () => {
    if (slideIdx > 0) {
      setSlideIdx(slideIdx - 1);
    }
  };

  // Still counting the month: hold on the brand gradient instead of flashing
  // a zero-drop recap (or the not-yet state) while history loads.
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#FF8E7A', '#9D95F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          <ActivityIndicator color="#fff" size="large" />
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14.5,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 20,
              fontFamily: fontFamily.ui,
            }}
          >
            pulling your month together…
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // The fetch failed: say so honestly — never the "play more drops" copy when
  // the real story just didn't load.
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#FF8E7A', '#9D95F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 34,
          }}
        >
          <Press
            onPress={handleClose}
            scale={false}
            accessibilityLabel="Close wrapped"
            style={{
              position: 'absolute',
              top: 50,
              right: 14,
              width: 34,
              height: 34,
              zIndex: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon d={ICONS.close} size={17} color="#fff" sw={2} />
          </Press>

          <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
            🫧
          </Text>
          <Serif
            s={36}
            c="#fff"
            style={{ lineHeight: 41, marginTop: 16, textAlign: 'center' }}
          >
            hmm, that didn't load
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 22,
              marginTop: 12,
              maxWidth: 300,
              textAlign: 'center',
              fontFamily: fontFamily.ui,
            }}
          >
            {`your month with ${partner.name} is safe — we just couldn't reach it.`}
          </Text>
          <View style={{ marginTop: 26, width: '100%' }}>
            <Btn kind="soft" onPress={refetch}>
              try again
            </Btn>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Not enough real reveals for a recap in this range: the warm not-yet state.
  const tooFew = isYear
    ? yStats.count < MIN_DROPS_FOR_YEAR_WRAPPED
    : stats.count < MIN_DROPS_FOR_WRAPPED;
  if (!loading && tooFew) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#FF8E7A', '#9D95F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 34,
          }}
        >
          <Press
            onPress={handleClose}
            scale={false}
            accessibilityLabel="Close wrapped"
            style={{
              position: 'absolute',
              top: 50,
              right: 14,
              width: 34,
              height: 34,
              zIndex: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon d={ICONS.close} size={17} color="#fff" sw={2} />
          </Press>

          <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
            🌱
          </Text>
          <Serif
            s={36}
            c="#fff"
            style={{ lineHeight: 41, marginTop: 16, textAlign: 'center' }}
          >
            {isYear
              ? 'your year is still writing itself'
              : 'your first month is still writing itself'}
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 22,
              marginTop: 12,
              maxWidth: 300,
              textAlign: 'center',
              fontFamily: fontFamily.ui,
            }}
          >
            {isYear
              ? "come back when you've played a few more drops — your year gets wrapped from your real reveals, nothing else."
              : "come back when you've played a few more drops — your recap is built from your real reveals, nothing else."}
          </Text>
          <View style={{ marginTop: 26, width: '100%' }}>
            <Btn kind="soft" onPress={handleClose}>
              back to today
            </Btn>
          </View>
          <Press
            onPress={handleToggleRange}
            scale={false}
            accessibilityLabel={isYear ? 'See this month wrapped' : 'See your year wrapped'}
            style={{ marginTop: 18, width: 'auto' }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 20,
                textAlign: 'center',
                fontFamily: fontFamily.ui,
              }}
            >
              {isYear ? 'back to this month →' : 'rewind the whole year →'}
            </Text>
          </Press>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={slide.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Progress bars */}
        <View
          style={{
            position: 'absolute',
            top: 56,
            left: 16,
            right: 16,
            flexDirection: 'row',
            gap: 5,
            zIndex: 20,
          }}
        >
          {slides.map((_, k) => {
            const isCurrent = k === slideIdx;
            const isPassed = k < slideIdx;
            const fillWidth = isCurrent
              ? barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
              : isPassed
              ? '100%'
              : '0%';

            return (
              <View
                key={`bar-${k}`}
                style={{
                  flex: 1,
                  height: 3.5,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                  overflow: 'hidden',
                }}
              >
                <RNAnimated.View
                  style={{
                    height: 3.5,
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    width: fillWidth,
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Close button */}
        <Press
          onPress={handleClose}
          scale={false}
          accessibilityLabel="Close wrapped"
          style={{
            position: 'absolute',
            top: 50,
            right: 14,
            width: 34,
            height: 34,
            zIndex: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon d={ICONS.close} size={17} color="#fff" sw={2} />
        </Press>

        {/* Tap zones: left ~32% for prev, right for next */}
        <Press
          onPress={handlePrev}
          scale={false}
          accessibilityLabel="Previous slide"
          style={{
            position: 'absolute',
            left: 0,
            top: 80,
            bottom: 0,
            width: '32%',
            zIndex: 15,
          }}
        >
          <View />
        </Press>

        <Press
          onPress={handleNext}
          scale={false}
          accessibilityLabel="Next slide"
          style={{
            position: 'absolute',
            right: 0,
            top: 80,
            bottom: 90,
            width: '68%',
            zIndex: 15,
          }}
        >
          <View />
        </Press>

        {/* Content container */}
        <View
          key={`slide-${slideIdx}`}
          style={{
            position: 'absolute',
            inset: 0,
            paddingTop: 80,
            paddingHorizontal: 34,
            paddingBottom: 30,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 18,
          }}
        >
          {/* COVER SLIDE */}
          {slide.kind === 'cover' && (
            <View style={{ alignItems: 'center' }}>
              {/* Two avatars overlapping */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginBottom: 22,
                }}
              >
                <Tok who={{ initial: me.initial, name: me.name }} you size={66} ring />
                <View style={{ marginLeft: -18 }}>
                  <Tok who={{ initial: partner.initial, name: partner.name }} size={66} ring />
                </View>
              </View>

              <Kick c="rgba(255,255,255,0.85)">
                {isYear ? `parallax · ${year}` : `parallax · ${month}`}
              </Kick>
              <Serif
                s={62}
                c="#fff"
                style={{
                  marginTop: 10,
                  lineHeight: 65,
                  textAlign: 'center',
                }}
              >
                {isYear ? `Wavelength\nWrapped '${yy}` : `Your month,\nwrapped`}
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: 14,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                {`${me.name} & ${partner.name} · tap to begin →`}
              </Text>
              <Press
                onPress={handleToggleRange}
                scale={false}
                accessibilityLabel={isYear ? 'See this month wrapped' : 'See your year wrapped'}
                style={{ marginTop: 20, width: 'auto' }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 20,
                    textAlign: 'center',
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {isYear ? 'back to this month →' : 'rewind the whole year →'}
                </Text>
              </Press>
            </View>
          )}

          {/* STAT SLIDES (big real numbers) */}
          {slide.kind === 'stat' && slide.big != null && (
            <View style={{ alignItems: 'center' }}>
              <Kick c="rgba(255,255,255,0.85)">{slide.kicker}</Kick>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize:
                    slide.big.length > 2 ? 120 : 150,
                  color: '#fff',
                  lineHeight:
                    slide.big.length > 2 ? 108 : 135,
                  marginVertical: 10,
                  fontFamily: fontFamily.disp,
                  fontWeight: '400',
                  textAlign: 'center',
                }}
              >
                {slide.big}
              </Text>
              {slide.unit && (
                <Serif
                  s={34}
                  italic
                  c="#fff"
                  style={{
                    textAlign: 'center',
                  }}
                >
                  {slide.unit}
                </Serif>
              )}
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 24,
                  marginTop: 18,
                  maxWidth: 280,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                {slide.sub}
              </Text>
            </View>
          )}

          {/* CURVE SLIDE (the year's hit-rate, month by month) */}
          {slide.kind === 'curve' && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Kick c="rgba(255,255,255,0.85)">{slide.kicker}</Kick>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 7,
                  marginTop: 30,
                }}
              >
                {yStats.curve.map((m) => (
                  <View key={`curve-${m.month}`} style={{ alignItems: 'center', gap: 6 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 16,
                        fontFamily: fontFamily.mono,
                      }}
                    >
                      {String(m.avg)}
                    </Text>
                    <View
                      style={{
                        width: 16,
                        height: Math.max(8, Math.round(m.avg * 1.1)),
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,255,255,0.92)',
                      }}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 14,
                        fontFamily: fontFamily.mono,
                      }}
                    >
                      {monthShort(m.month)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 24,
                  marginTop: 26,
                  maxWidth: 280,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                {slide.sub}
              </Text>
            </View>
          )}

          {/* ARCHETYPE SLIDE (derived from the couple's real patterns) */}
          {slide.kind === 'archetype' && slide.big != null && (
            <View style={{ alignItems: 'center' }}>
              <Kick c="rgba(255,255,255,0.85)">{slide.kicker}</Kick>
              <Serif
                s={46}
                italic
                c="#fff"
                style={{ lineHeight: 52, marginTop: 14, textAlign: 'center' }}
              >
                {slide.big}
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 24,
                  marginTop: 18,
                  maxWidth: 280,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                {slide.sub}
              </Text>
            </View>
          )}

          {/* SHARE SLIDE */}
          {slide.kind === 'share' && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Serif
                s={44}
                c="#fff"
                style={{
                  lineHeight: 48,
                  textAlign: 'center',
                }}
              >
                {`Show the\nworld your ${isYear ? 'year' : 'month'}.`}
              </Serif>

              {/* Share preview card - frosted glass, spoiler-free */}
              <BlurView
                intensity={14}
                tint="light"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderRadius: 24,
                  paddingVertical: 20,
                  paddingHorizontal: 18,
                  marginVertical: 24,
                  marginHorizontal: 0,
                  alignItems: 'center',
                  gap: 10,
                  overflow: 'hidden',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 19,
                    letterSpacing: 0.06 * 19,
                    color: '#fff',
                    lineHeight: 28,
                  }}
                >
                  {weeklyDots(history)}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.32,
                    lineHeight: 11,
                    color: 'rgba(255,255,255,0.85)',
                    textTransform: 'uppercase',
                    fontFamily: fontFamily.mono,
                  }}
                >
                  {`${me.name.toUpperCase()} & ${partner.name.toUpperCase()} · ${isYear ? yStats.avgWave : stats.avgWave}% IN SYNC`}
                </Text>
              </BlurView>

              <Btn kind="soft" onPress={handleShare} sub="post your wrapped">
                Share our Wrapped
              </Btn>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
