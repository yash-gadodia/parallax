import React, { useState } from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Sheet from '../../src/components/Sheet';
import Press from '../../src/components/Press';
import Toast from '../../src/components/Toast';
import { Wordmark } from '../../src/components/Wordmark';
import { Serif } from '../../src/components/Text';
import { colors, gradients, shadows } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { usePlayStore, computeReveal } from '../../src/store/play';
import { DROP } from '../../src/content/drop';

export default function ShareSheet() {
  const router = useRouter();
  const playState = usePlayStore();
  const reveal = computeReveal(playState);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const handleClose = () => {
    router.back();
  };

  const handleShare = (platform: 'Messages' | 'Instagram' | 'Copy') => {
    handleClose();
    const msg =
      platform === 'Copy'
        ? 'Copied to clipboard'
        : `Shared to ${platform}`;
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const grid = DROP.prompts
    .map((p, i) => {
      const twin = playState.myPicks[i] === p.remy;
      const ok = playState.myHunches[i] === p.remy;
      return p.emoji + (twin ? '👯' : ok ? '💞' : '🤍');
    })
    .join('  ');

  return (
    <>
      <Sheet title="share via" onClose={handleClose}>
        <View style={{ marginBottom: 18 }}>
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              ...shadows.shadow,
            }}
          >
            <View
              style={{
                paddingHorizontal: 22,
                paddingTop: 22,
                paddingBottom: 24,
                position: 'relative',
              }}
            >
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <RadialGradient id="shareGrad" cx="85%" cy="0%" r="70%">
                    <Stop offset="0" stopColor="#fff" stopOpacity={0.45} />
                    <Stop offset="0.6" stopColor="#fff" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#shareGrad)" />
              </Svg>
              <View style={{ position: 'relative' }}>
                <View style={{ marginBottom: 16 }}>
                  <Wordmark size={20} light />
                </View>
                <Serif s={56} c="#fff" style={{ marginBottom: 2, lineHeight: 56 * 0.96 }}>
                  {reveal.wave}%
                </Serif>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: 20,
                    marginTop: 2,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  on the same wavelength
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 19,
                    letterSpacing: 0.06 * 19,
                    marginBottom: 14,
                    marginTop: 16,
                    color: '#fff',
                    lineHeight: 28,
                  }}
                >
                  {grid}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    color: 'rgba(255,255,255,0.85)',
                    textTransform: 'uppercase',
                    lineHeight: 14,
                  }}
                >
                  YASH & DANI · {DROP.code}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Messages', bg: '#34C759', isGray: false },
            { label: 'Instagram', bg: '#C13584', isGray: false },
            { label: 'Copy', bg: colors.surface, isGray: true },
          ].map((btn) => (
            <Press
              key={btn.label}
              onPress={() =>
                handleShare(btn.label as 'Messages' | 'Instagram' | 'Copy')
              }
              scale={true}
              style={{ flex: 1, width: 'auto' }}
            >
              <View
                style={{
                  backgroundColor: btn.isGray ? colors.surface : btn.bg,
                  borderWidth: btn.isGray ? 1 : 0,
                  borderColor: colors.line,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                  ...shadows.shadowSoft,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    lineHeight: 18,
                    color: btn.isGray ? colors.ink : '#fff',
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {btn.label}
                </Text>
              </View>
            </Press>
          ))}
        </View>
      </Sheet>

      {toastMsg && <Toast msg={toastMsg} />}
    </>
  );
}
