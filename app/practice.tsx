import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useIdentity } from '../src/features/profile/useIdentity';
import { useCouple } from '../src/features/pairing/useCouple';
import { usePracticeRound, PRACTICE_ROUND_SIZE } from '../src/features/practice/usePracticeRound';
import { nudge } from '../src/features/engagement/engagementActions';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <DawnBlobs />
      {children}
    </View>
  );
}

export default function PracticeScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const { couple } = useCouple();
  const { prompts, loading, error, notEnough, retry } = usePracticeRound();

  // guesses[i] is my hunch for prompts[i]; the current question is revealed
  // once its guess exists. idx === PRACTICE_ROUND_SIZE is the end screen.
  const [idx, setIdx] = useState(0);
  const [guesses, setGuesses] = useState<number[]>([]);
  const [nudged, setNudged] = useState(false);

  const handleBack = () => {
    safeBack(router);
  };

  if (loading) {
    return (
      <Frame>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Kick c={colors.inkSoft}>picking from your story…</Kick>
        </SafeAreaView>
      </Frame>
    );
  }

  if (error) {
    return (
      <Frame>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.gutter,
              gap: 12,
            }}
          >
            <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
              🌫️
            </Text>
            <Serif s={30} italic c={colors.ink} style={{ textAlign: 'center' }}>
              couldn't load your reveals
            </Serif>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14.5,
                lineHeight: 21,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              your story is safe — this is just a connection hiccup.
            </Text>
            <View style={{ width: '100%', marginTop: 14, gap: 10 }}>
              <Btn kind="ink" onPress={retry}>
                try again
              </Btn>
              <Btn kind="soft" onPress={handleBack}>
                back to today
              </Btn>
            </View>
          </View>
        </SafeAreaView>
      </Frame>
    );
  }

  if (notEnough) {
    return (
      <Frame>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.gutter,
              gap: 12,
            }}
          >
            <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
              🎯
            </Text>
            <Serif s={30} italic c={colors.ink} style={{ textAlign: 'center' }}>
              not enough story yet
            </Serif>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14.5,
                lineHeight: 21,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              practice pulls from your real reveals. unlock a few together and
              you'll have {partner.name}'s answers to read.
            </Text>
            <View style={{ width: '100%', marginTop: 14 }}>
              <Btn kind="soft" onPress={handleBack}>
                back to today
              </Btn>
            </View>
          </View>
        </SafeAreaView>
      </Frame>
    );
  }

  const answered = guesses.length;
  const score = guesses.reduce(
    (n, g, i) => n + (g === prompts[i].partnerPick ? 1 : 0),
    0
  );
  const tally = `you read ${partner.name} ${score}/${PRACTICE_ROUND_SIZE}`;

  // End screen: score + a nudge back into the real loop. Solo throughout —
  // nothing was sent, no streak moved.
  if (idx >= PRACTICE_ROUND_SIZE) {
    return (
      <Frame>
        <TopBar title="practice" onBack={handleBack} />
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.gutter,
              gap: 12,
            }}
          >
            <Kick c={colors.p2Deep}>practice · nothing is sent</Kick>
            <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
              {score === PRACTICE_ROUND_SIZE ? '🔮' : score >= 2 ? '💫' : '🌱'}
            </Text>
            <Serif s={34} italic c={colors.ink} style={{ textAlign: 'center' }}>
              {tally}
            </Serif>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 14.5,
                lineHeight: 21,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              {score === PRACTICE_ROUND_SIZE
                ? 'flawless. the real reveal is waiting on them.'
                : `every round tunes your read on ${partner.name} — the real one counts double.`}
            </Text>
            <View style={{ width: '100%', marginTop: 14, gap: 10 }}>
              {!nudged && (
                <Btn
                  kind="us"
                  onPress={() => {
                    if (!couple) return;
                    setNudged(true);
                    nudge(couple.id).catch(() => {
                      // already-nudged / offline — engagementActions toasted honestly.
                    });
                  }}
                  sub="a soft hello — zero pressure"
                >
                  send {partner.name} a nudge 👋
                </Btn>
              )}
              <Btn kind="soft" onPress={handleBack}>
                Done
              </Btn>
            </View>
          </View>
        </SafeAreaView>
      </Frame>
    );
  }

  const prompt = prompts[idx];
  const myGuess = idx < answered ? guesses[idx] : null;
  const revealedGuess = myGuess !== null;
  const gotIt = revealedGuess && myGuess === prompt.partnerPick;
  const isLast = idx === PRACTICE_ROUND_SIZE - 1;

  const choose = (oi: number) => {
    if (revealedGuess) return;
    setGuesses((g) => [...g, oi]);
  };

  return (
    <Frame>
      <TopBar title="practice" onBack={handleBack} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 62,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Kick c={colors.p2Deep}>practice · nothing is sent</Kick>
            <Kick>
              {idx + 1}/{PRACTICE_ROUND_SIZE}
            </Kick>
          </View>

          <Text
            allowFontScaling={false}
            style={{ fontSize: 50, marginBottom: 8, color: colors.ink }}
          >
            {prompt.emoji}
          </Text>

          <Serif s={34} style={{ marginBottom: 24 }}>
            {prompt.q}
          </Serif>

          <View
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 7,
              paddingHorizontal: 13,
              borderRadius: radius.pill,
              backgroundColor: 'rgba(157,149,245,0.18)',
              marginBottom: 16,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                fontWeight: '700',
                lineHeight: 18,
                color: colors.p2Deep,
                fontFamily: fontFamily.ui,
              }}
            >
              {revealedGuess
                ? `${partner.name}'s recorded pick`
                : `Your hunch — what did ${partner.name} pick back then?`}
            </Text>
          </View>

          <View style={{ display: 'flex', gap: 11 }}>
            {prompt.opts.map((option, oi) => {
              const isMyGuess = revealedGuess && myGuess === oi;
              const isTheirPick = revealedGuess && prompt.partnerPick === oi;
              const fill = isTheirPick
                ? gotIt
                  ? colors.match
                  : colors.p2
                : colors.surface;
              const selectedLook = isTheirPick;
              return (
                <Press
                  key={oi}
                  onPress={() => choose(oi)}
                  scale={!revealedGuess}
                  accessibilityLabel={`Your hunch: ${option}`}
                  accessibilityState={{ selected: isMyGuess }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 13,
                    paddingVertical: 17,
                    paddingHorizontal: 18,
                    borderRadius: 20,
                    backgroundColor: fill,
                    borderWidth: 1.5,
                    borderColor: selectedLook
                      ? fill
                      : isMyGuess
                        ? colors.p1Deep
                        : colors.line,
                    ...(selectedLook ? shadows.shadow : shadows.shadowSoft),
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: radius.pill,
                      flexShrink: 0,
                      borderWidth: 2,
                      borderColor: selectedLook ? '#fff' : colors.inkMute,
                      backgroundColor: selectedLook ? '#fff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedLook && (
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: radius.pill,
                          backgroundColor: gotIt ? colors.matchDeep : colors.p2Deep,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      flex: 1,
                      fontSize: 15.5,
                      fontWeight: '600',
                      lineHeight: 19,
                      color: selectedLook ? '#fff' : colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {option}
                  </Text>
                  {isMyGuess && (
                    <Kick c={selectedLook ? '#fff' : colors.p1Deep}>your hunch</Kick>
                  )}
                </Press>
              );
            })}
          </View>

          {revealedGuess && (
            <View style={{ marginTop: 20, gap: 10 }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  lineHeight: 20,
                  color: gotIt ? colors.matchDeep : colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                {gotIt
                  ? '✓ you read them right'
                  : `not this time — they went with "${prompt.opts[prompt.partnerPick]}"`}
              </Text>
              <Kick c={colors.inkMute}>{tally}</Kick>
              <View style={{ marginTop: 6 }}>
                <Btn kind="ink" onPress={() => setIdx((i) => i + 1)}>
                  {isLast ? 'see your score →' : 'next question →'}
                </Btn>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Frame>
  );
}
