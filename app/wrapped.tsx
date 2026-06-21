import React, { useState } from 'react';
import {
  View,
  Text,
  Animated as RNAnimated,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { colors, gradients, radius, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Icon, ICONS } from '../src/components/Icon';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import { WRAP, COUPLE_TYPE } from '../src/content/extras';

const YOU = { initial: 'Y' };
const PAR = { initial: 'D' };

export default function WrappedScreen() {
  const router = useRouter();
  const [slideIdx, setSlideIdx] = useState(0);
  const { height: screenHeight } = useWindowDimensions();

  const slide = WRAP[slideIdx];
  const isLastSlide = slideIdx === WRAP.length - 1;

  // Extract gradient colors from the bg string (linear-gradient or var(--us))
  const getGradientFromBg = (bg: string): { colors: readonly [string, string, ...string[]]; locations: readonly number[] } => {
    if (bg === 'var(--us)') {
      return {
        colors: gradients.us.colors,
        locations: gradients.us.locations,
      };
    }
    // Parse linear-gradient(angle,color1,color2,...)
    const match = bg.match(/linear-gradient\([^,]+,([^,]+),([^,]+)(?:,([^)]+))?\)/);
    if (match) {
      const c1 = match[1].trim();
      const c2 = match[2].trim();
      const c3 = match[3]?.trim();
      if (c3) {
        return {
          colors: [c1, c2, c3] as const,
          locations: [0, 0.48, 1] as const,
        };
      }
      return {
        colors: [c1, c2] as const,
        locations: [0, 1] as const,
      };
    }
    return { colors: ['#FF8E7A', '#9D95F5'] as const, locations: [0, 1] as const };
  };

  const gradientInfo = getGradientFromBg(slide.bg);

  const handleNext = () => {
    if (isLastSlide) {
      router.back();
    } else {
      setSlideIdx(slideIdx + 1);
    }
  };

  const handlePrev = () => {
    if (slideIdx > 0) {
      setSlideIdx(slideIdx - 1);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleShare = () => {
    router.push('/(sheets)/share');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={gradientInfo.colors}
        locations={gradientInfo.locations as readonly [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Sheen overlay */}
        <View
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
          }}
        >
          <BlurView intensity={0} style={{ flex: 1 }} />
        </View>

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
          {WRAP.map((_, k) => {
            const isCurrent = k === slideIdx;
            const isPassed = k < slideIdx;

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
                    width: `${(isPassed ? 100 : isCurrent ? 100 : 0)}%`,
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
                <Tok who={YOU} you size={66} ring />
                <View style={{ marginLeft: -18 }}>
                  <Tok who={PAR} size={66} ring />
                </View>
              </View>

              <Kick c="rgba(255,255,255,0.85)">parallax · june</Kick>
              <Serif
                s={62}
                c="#fff"
                style={{
                  marginTop: 10,
                  lineHeight: 65,
                  textAlign: 'center',
                }}
              >
                Your month,{'\n'}wrapped
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
                Yash & Dani · tap to begin →
              </Text>
            </View>
          )}

          {/* STAT SLIDES (big numbers) */}
          {slide.big && slide.kind !== 'type' && (
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

          {/* COUPLE TYPE SLIDE */}
          {slide.kind === 'type' && (
            <View style={{ alignItems: 'center' }}>
              <Kick c="rgba(255,255,255,0.85)">your couple type</Kick>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 56,
                  color: '#fff',
                  lineHeight: 56,
                  marginTop: 14,
                  marginBottom: 14,
                }}
              >
                {COUPLE_TYPE.emoji}
              </Text>
              <Serif
                s={48}
                c="#fff"
                style={{
                  lineHeight: 54,
                  textAlign: 'center',
                }}
              >
                {COUPLE_TYPE.name}
              </Serif>
              <Serif
                s={21}
                italic
                c="rgba(255,255,255,0.95)"
                style={{
                  lineHeight: 27,
                  marginTop: 14,
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                {COUPLE_TYPE.line}
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 23,
                  marginTop: 14,
                  maxWidth: 300,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                {COUPLE_TYPE.body}
              </Text>

              {/* Trait pills */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 7,
                  marginTop: 14,
                }}
              >
                {COUPLE_TYPE.traits.map((trait: string, idx: number) => (
                  <View
                    key={`trait-${idx}`}
                    style={{
                      paddingVertical: 7,
                      paddingHorizontal: 13,
                      borderRadius: radius.pill,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>
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
                Show the{'\n'}world your type.
              </Serif>

              {/* Share preview card */}
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderRadius: 24,
                  paddingVertical: 20,
                  paddingHorizontal: 18,
                  marginVertical: 24,
                  marginHorizontal: 0,
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 26,
                      color: '#fff',
                    }}
                  >
                    {COUPLE_TYPE.emoji}
                  </Text>
                  <Serif
                    s={28}
                    c="#fff"
                    style={{
                      lineHeight: 31,
                    }}
                  >
                    {COUPLE_TYPE.name}
                  </Serif>
                </View>
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
                  YASH & DANI · 83% IN SYNC
                </Text>
              </View>

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
