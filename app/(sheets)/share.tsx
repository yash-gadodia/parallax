import React, { useRef, useState } from 'react';
import { View, Text, useWindowDimensions, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import { useRouter } from 'expo-router';
import { safeBack } from "../../src/lib/nav";
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Sheet from '../../src/components/Sheet';
import Press from '../../src/components/Press';
import Toast from '../../src/components/Toast';
import Tok from '../../src/components/Tok';
import { Wordmark } from '../../src/components/Wordmark';
import { Serif } from '../../src/components/Text';
import { colors, gradients, shadows } from '../../src/design/tokens';
import { fontFamily } from '../../src/design/typography';
import { usePlayStore, computeReveal } from '../../src/store/play';
import { DROP } from '../../src/content/drop';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useTodayState } from '../../src/features/drops/useTodayState';
import { useCoupleHistory } from '../../src/features/lovemap/useCoupleHistory';
import { weeklyDots, waveDot } from '../../src/features/history/historyStats';
import { buildLiveShareMessage } from '../../src/features/history/shareMessage';

export default function ShareSheet() {
  const router = useRouter();
  const playState = usePlayStore();
  const { me, partner } = useIdentity();
  const { session } = useSession();
  const { couple } = useCouple();
  const isLive = !!session && !!couple;
  const { today } = useTodayState(session && couple ? couple.id : null);
  const { history } = useCoupleHistory();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const handleClose = () => {
    safeBack(router);
  };

  // Server-true wavelength when signed in: today's stored wave_pct (0014) when
  // revealed, else the latest revealed day from couple_history. The local
  // computeReveal score is DEMO-only (no session) — never shared as real.
  const serverWave =
    today?.state === 'revealed' && today.wave_pct != null
      ? today.wave_pct
      : isLive && history.length > 0
        ? history[0].wavelength
        : null;
  const demoReveal = computeReveal(playState);
  const wave = isLive ? serverWave : demoReveal.wave;
  // Spoiler-free weekly pattern from real revealed days — never Q&A.
  const dots = isLive ? weeklyDots(history) : '';
  const streak = couple?.streak ?? 0;

  // The card's per-day dots: same waveDot tones as the text share, plus the
  // honest muted rendering for caught-up (grace-repaired) days.
  const dayDots = isLive
    ? history.slice(0, 7).map((h) => ({ dot: waveDot(h.wavelength), caughtUp: h.caught_up }))
    : [];

  const shareMessage = isLive
    ? buildLiveShareMessage({
        names: partner.hasPartner ? `${me.name} & ${partner.name}` : me.name,
        wave,
        streak,
        dots,
      })
    : `We're ${demoReveal.wave}% on the same wavelength 💞. Find yours on Parallax.`;

  const handleShare = async (platform: 'Messages' | 'Instagram' | 'Copy') => {
    if (platform === 'Copy') {
      try {
        await Clipboard.setStringAsync(shareMessage);
        setToastMsg('Copied to clipboard');
      } catch {
        setToastMsg("Couldn't share, try again");
      }
      setTimeout(() => setToastMsg(null), 2200);
      return;
    }
    // Messages/Instagram → the pre-rendered 9:16 card image via the OS share
    // sheet; the spoiler-free text is the honest fallback when capture fails.
    let uri: string | null = null;
    try {
      uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
      });
    } catch {
      uri = null;
    }
    try {
      if (uri) {
        await Share.share({ url: uri });
      } else {
        await Share.share({ message: shareMessage });
      }
      handleClose();
    } catch {
      setToastMsg("Couldn't share, try again");
      setTimeout(() => setToastMsg(null), 2200);
    }
  };

  // The card's demo pattern row (no session only): static DROP vs local play
  // state — the live card uses the real weekly dots above.
  const grid = isLive
    ? ''
    : DROP.prompts
        .map((p, i) => {
          const twin = playState.myPicks[i] === p.remy;
          const ok = playState.myHunches[i] === p.remy;
          return p.emoji + (twin ? '👯' : ok ? '💞' : '🤍');
        })
        .join('  ');

  const cardW = Math.min(250, width - 100);

  return (
    <>
      <Sheet title="share via" onClose={handleClose}>
        <View style={{ marginBottom: 18, alignItems: 'center' }}>
          {/* The capture target: a 9:16 (1080x1920, scaled) story card. */}
          <View
            ref={cardRef}
            collapsable={false}
            testID="share-card"
            style={{
              width: cardW,
              aspectRatio: 9 / 16,
              borderRadius: 24,
              overflow: 'hidden',
              ...shadows.shadow,
            }}
          >
            <LinearGradient
              colors={gradients.us.colors}
              locations={gradients.us.locations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
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
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 20,
                  paddingVertical: 22,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Tok who={{ initial: me.initial, name: me.name }} you size={26} ring decorative />
                  {partner.hasPartner && (
                    <View style={{ marginLeft: -8 }}>
                      <Tok
                        who={{ initial: partner.initial, name: partner.name }}
                        size={26}
                        ring
                        decorative
                      />
                    </View>
                  )}
                  <Text
                    allowFontScaling={false}
                    style={{
                      marginLeft: 10,
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#fff',
                      lineHeight: 18,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {partner.hasPartner ? `${me.name} & ${partner.name}` : me.name}
                  </Text>
                </View>

                <View>
                  <Serif s={56} c="#fff" style={{ marginBottom: 2, lineHeight: 56 * 1.3 }}>
                    {`${wave ?? '—'}%`}
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
                  {dayDots.length > 0 && (
                    <View
                      testID="share-card-dots"
                      style={{ flexDirection: 'row', gap: 5, marginTop: 14 }}
                    >
                      {dayDots.map((d, i) => (
                        <Text
                          key={i}
                          testID={`share-dot-${i}`}
                          allowFontScaling={false}
                          style={{
                            fontSize: 16,
                            lineHeight: 22,
                            color: '#fff',
                            opacity: d.caughtUp ? 0.45 : 1,
                          }}
                        >
                          {d.dot}
                        </Text>
                      ))}
                    </View>
                  )}
                  {grid !== '' && (
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 15,
                        letterSpacing: 0.06 * 15,
                        marginTop: 14,
                        color: '#fff',
                        lineHeight: 22,
                      }}
                    >
                      {grid}
                    </Text>
                  )}
                  {streak > 0 && (
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 12,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 16,
                        marginTop: 12,
                      }}
                    >
                      {`${streak}🔥`}
                    </Text>
                  )}
                </View>

                <Wordmark size={14} light />
              </View>
            </LinearGradient>
          </View>
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
