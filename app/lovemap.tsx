import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from "../src/lib/nav";

import TopBar from '../src/components/TopBar';
import { Peek } from '../src/components/Peek';
import { Float } from '../src/components/Float';
import { Serif, Kick } from '../src/components/Text';
import Tok from '../src/components/Tok';
import Btn from '../src/components/Btn';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { Icon, ICONS } from '../src/components/Icon';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Skeleton } from '../src/components/Skeleton';
import { useLearnings } from '../src/features/lovemap/useLearnings';
import { useIdentity, Person } from '../src/features/profile/useIdentity';

function WhoChip({ who, me, partner }: { who: 'you' | 'dani'; me: Person; partner: Person }) {
  const isYou = who === 'you';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        paddingLeft: 4,
        borderRadius: radius.pill,
        backgroundColor: isYou ? 'rgba(255,142,122,0.14)' : 'rgba(157,149,245,0.16)',
      }}
    >
      <Tok who={isYou ? { initial: me.initial } : { initial: partner.initial, name: partner.name }} you={isYou} size={18} />
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: isYou ? colors.p1Deep : colors.p2Deep,
          fontFamily: fontFamily.ui,
          lineHeight: 16,
        }}
      >
        {isYou ? 'You' : partner.name}
      </Text>
    </View>
  );
}

function LearnCard({
  l,
  me,
  partner,
}: {
  l: { emoji: string | null; need: string | null; detail: string | null; source: string; mastery: number; about: string; became_prompt_id: string | null; became_question?: string | null };
  me: Person;
  partner: Person;
}) {
  const isYou = l.about === 'you';
  const fromFight = l.source === 'refocus';

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 22,
        padding: 16,
        ...shadows.shadow,
      }}
    >
      {/* Header: emoji + chip + badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <Text allowFontScaling={false} style={{ fontSize: 22 }}>
          {l.emoji}
        </Text>
        <WhoChip who={isYou ? 'you' : 'dani'} me={me} partner={partner} />
        <View style={{ flex: 1 }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: radius.pill,
            backgroundColor: fromFight ? 'rgba(157,149,245,0.16)' : colors.sunken,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 8.5,
              fontWeight: '700',
              letterSpacing: 1.02,
              textTransform: 'uppercase',
              color: fromFight ? colors.p2Deep : colors.inkSoft,
            }}
          >
            {fromFight ? '💢 FROM A FIGHT' : '💬 FROM A DROP'}
          </Text>
        </View>
      </View>

      {/* Need (title) */}
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.ink,
          lineHeight: 16 * 1.3,
          fontFamily: fontFamily.ui,
        }}
      >
        {l.need}
      </Text>

      {/* Detail */}
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 13.5,
          color: colors.inkSoft,
          lineHeight: 13.5 * 1.45,
          marginTop: 4,
          fontFamily: fontFamily.ui,
        }}
      >
        {l.detail}
      </Text>

      {/* Became Q card (optional). (The mastery meter is gone until mastery is
          actually reinforced server-side — no decorative progress.) */}
      {l.became_prompt_id && (
        <LinearGradient
          colors={gradients.usSoft.colors}
          locations={gradients.usSoft.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginTop: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 13,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: colors.p2Deep,
                marginBottom: 5,
                fontWeight: '700',
              }}
            >
              🎯 now a question in your drops
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13.5,
                color: colors.ink,
                fontStyle: 'italic',
                fontFamily: fontFamily.disp,
                lineHeight: 13.5 * 1.4,
              }}
            >
              {l.became_question
                ? `“${l.became_question}”`
                : 'This learning is being woven into future prompts.'}
            </Text>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

export default function LovemapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: learnings, loading, isSample, error, refetch } = useLearnings();
  const { me, partner } = useIdentity();
  const fightCount = learnings.filter(l => l.source === 'refocus').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      {/* Background: dawn gradient + blobs */}
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <DawnBlobs />

      {/* TopBar */}
      <TopBar
        title="love map"
        onBack={() => safeBack(router)}
      />

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 52 + 46,
          paddingHorizontal: space.gutter,
          paddingBottom: 160 + insets.bottom,
        }}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Hero: Peek + heading + copy */}
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <View style={{ marginBottom: 6, justifyContent: 'center', alignItems: 'center' }}>
            <Float distance={7} duration={4000}>
              <Peek size={76} mood="focus" />
            </Float>
          </View>
          <Serif s={36} c={colors.ink} style={{ textAlign: 'center' }}>
            What you're learning{'\n'}about each other
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14.5,
              color: colors.inkSoft,
              lineHeight: 20,
              maxWidth: 300,
              marginTop: 10,
              textAlign: 'center',
              fontFamily: fontFamily.ui,
            }}
          >
            Every drop and every fight teaches Parallax a little more about how you each see the world. The more it knows, the better its questions get.
          </Text>
        </View>

        {/* The parallax loop card */}
        <View
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            marginTop: 22,
            marginBottom: 24,
            ...shadows.shadow,
          }}
        >
          <LinearGradient
            colors={gradients.us.colors}
            locations={gradients.us.locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 18,
              paddingBottom: 20,
            }}
          >
            {/* Radial overlay (simulating the white radial gradient in the source) */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
              pointerEvents="none"
            />

            <View style={{ position: 'relative', zIndex: 1 }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 9.5,
                  letterSpacing: 2.128,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: '700',
                }}
              >
                the parallax loop
              </Text>
              <Serif s={24} c="#fff" style={{ marginTop: 4 }}>
                A fight becomes a lesson.
              </Serif>

              <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 9, marginTop: 14 }}>
                {[
                  { emoji: '💢', bold: 'you fought', light: 'the Saturday silence' },
                  { emoji: '🤍', bold: 'you refocused', light: "found each other's side" },
                  { emoji: '🎯', bold: 'it became a Q', light: 'now in your drops' },
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.16)',
                        borderRadius: 14,
                        padding: 11,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ fontSize: 20 }}
                      >
                        {step.emoji}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 11.5,
                          fontWeight: '700',
                          color: '#fff',
                          marginTop: 5,
                          lineHeight: 14,
                          fontFamily: fontFamily.ui,
                          textAlign: 'center',
                        }}
                      >
                        {step.bold}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 9.5,
                          color: 'rgba(255,255,255,0.85)',
                          marginTop: 2,
                          lineHeight: 12,
                          fontFamily: fontFamily.ui,
                          textAlign: 'center',
                        }}
                      >
                        {step.light}
                      </Text>
                    </View>
                    {i < 2 && (
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: 14,
                          }}
                        >
                          →
                        </Text>
                      </View>
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Learnings section header (counts only make sense once loaded) */}
        {!loading && !error && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginHorizontal: 2,
              marginBottom: 12,
            }}
          >
            <Kick c={colors.inkMute}>the map · {learnings.length} learnings</Kick>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                color: colors.inkMute,
                fontWeight: '400',
                letterSpacing: 1.8,
                textTransform: 'uppercase',
              }}
            >
              {fightCount} from fights
            </Text>
          </View>
        )}

        {/* Learning cards, with honest loading / error / empty states */}
        <View style={{ gap: space.gap }}>
          {loading ? (
            <>
              <Skeleton h={132} br={22} testID="lovemap-skeleton-card" />
              <Skeleton h={132} br={22} testID="lovemap-skeleton-card" />
            </>
          ) : error ? (
            <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 }}>
              <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 10 }}>
                🫧
              </Text>
              <Serif s={21} style={{ textAlign: 'center', marginBottom: 6 }}>
                hmm, that didn't load
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 13.5 * 1.45,
                  color: colors.inkMute,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                  marginBottom: 16,
                }}
              >
                Your map is safe — we just couldn't reach it.
              </Text>
              <Btn kind="soft" onPress={refetch} style={{ alignSelf: 'stretch' }}>
                try again
              </Btn>
            </View>
          ) : learnings.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 }}>
              <Text allowFontScaling={false} style={{ fontSize: 30, marginBottom: 10 }}>
                🌱
              </Text>
              <Serif s={21} style={{ textAlign: 'center', marginBottom: 6 }}>
                Nothing learned yet
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 13.5 * 1.45,
                  color: colors.inkMute,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                Play a daily drop or refocus a rough moment, and what you learn about
                each other shows up here.
              </Text>
            </View>
          ) : (
            learnings.map((l) => <LearnCard key={l.id} l={l} me={me} partner={partner} />)
          )}
        </View>

        {/* Privacy footer */}
        <Text
          allowFontScaling={false}
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.inkMute,
            lineHeight: 18,
            marginTop: 20,
            marginHorizontal: 14,
            fontFamily: fontFamily.ui,
          }}
        >
          The more honestly you play, the sharper your map. Nothing here is ever shown to anyone outside the two of you.
        </Text>
      </ScrollView>

      {/* Floating CTA button */}
      <View
        style={{
          position: 'absolute',
          left: space.gutter,
          right: space.gutter,
          bottom: 22 + insets.bottom,
          zIndex: 40,
        }}
      >
        <Btn
          kind="soft"
          onPress={() => router.push('/refocus')}
          sub="turn a rough moment into a lesson"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon d={ICONS.heart} size={17} color={colors.p2Deep} />
            <Text style={{ color: colors.ink }} allowFontScaling={false}>
              Refocus something
            </Text>
          </View>
        </Btn>
      </View>
    </View>
  );
}
