import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import { Kick, Serif } from '../src/components/Text';
import { colors, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';

// The grounding behind the loop (R6 / STRATEGY §4.3). Each card pairs a mechanic
// with the research area that inspired it — "inspired by", never fabricated
// quotes or claims, never therapy-speak.
const CARDS: Array<{ emoji: string; tag: string; title: string; body: string }> = [
  {
    emoji: '💬',
    tag: 'self-disclosure',
    title: 'The daily questions',
    body: "Answering a little more of yourself each day, together, is how closeness quietly builds. Parallax's drops are inspired by research on escalating, mutual self-disclosure — the small, honest questions that bring two people nearer.",
  },
  {
    emoji: '🔮',
    tag: 'perspective-taking',
    title: 'The hunch',
    body: 'Guessing what your partner picked is active perspective-taking — the effortful, caring act of seeing the world from their side. It is the part that makes you think about them, not just about you.',
  },
  {
    emoji: '👯',
    tag: 'shared reality',
    title: 'Twin moments',
    body: 'When you both land on the same answer with no hints, that is the small jolt of feeling known. Those matches are worth celebrating — so we lead with them, never with a grade.',
  },
  {
    emoji: '🔁',
    tag: 'daily ritual',
    title: 'One small ritual a day',
    body: 'Relationship-app studies find that tiny, consistent rituals do more than occasional big gestures. One drop a day — three minutes, then done — is designed to be a habit you keep, not a chore you dread.',
  },
  {
    emoji: '🌱',
    tag: 'repair & curiosity',
    title: "The misses are the conversation",
    body: "The answers you read wrong are not failures — they are tonight's conversation. Inspired by research on how couples repair and stay curious, every reveal ends with one thing worth talking about.",
  },
  {
    emoji: '🚫',
    tag: 'why we never grade',
    title: 'No score on your relationship',
    body: 'Research on couple apps found that comparative scores and streaks can become ammunition in a fight. So Parallax scores the guess, never the bond — the wavelength % is a game stat, not a verdict on you two.',
  },
];

export default function ScienceScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <TopBar title="the science" onBack={() => safeBack(router)} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: 52 + 58,
          paddingHorizontal: space.gutter,
          paddingBottom: 48,
        }}
      >
        <Serif s={32} italic c={colors.ink} style={{ marginBottom: 6 }}>
          why parallax works
        </Serif>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
            marginBottom: 20,
          }}
        >
          A little game with a serious idea behind it. Here is what each part is
          quietly built on — inspired by the research on how couples stay close.
        </Text>

        <View style={{ gap: 12 }}>
          {CARDS.map((c) => (
            <Card
              key={c.title}
              style={{ paddingHorizontal: 16, paddingVertical: 16, borderRadius: 22 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <Text allowFontScaling={false} style={{ fontSize: 20 }}>
                  {c.emoji}
                </Text>
                <Kick c={colors.p2Deep}>{c.tag}</Kick>
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  lineHeight: 21,
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                  marginBottom: 5,
                }}
              >
                {c.title}
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 20,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                {c.body}
              </Text>
            </Card>
          ))}
        </View>

        <Text
          allowFontScaling={false}
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: colors.inkMute,
            fontFamily: fontFamily.ui,
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          Parallax is a game for two, not therapy or medical advice.
        </Text>
      </ScrollView>
    </View>
  );
}
