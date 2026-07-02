import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import Chip from '../src/components/Chip';
import Btn from '../src/components/Btn';
import GradientText from '../src/components/GradientText';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useIdentity } from '../src/features/profile/useIdentity';
import { useOnThisDay } from '../src/features/history/useOnThisDay';
import type { OnThisDayPrompt } from '../src/features/history/useOnThisDay';
import { dayLabel } from '../src/features/history/historyStats';
import type { PromptAnswers } from '../src/domain/reveal';

// The reveal screen's compare-chip idiom, rebuilt small and local: the question
// up top, then "you" and the partner side by side. Answers only — a memory,
// not a scorecard.
function MemoryCompareCard({
  prompt,
  answer,
  partnerName,
  last,
}: {
  prompt: OnThisDayPrompt;
  answer: PromptAnswers | undefined;
  partnerName: string;
  last: boolean;
}) {
  const youPick = answer?.youPick ?? -1;
  const themPick = answer?.themPick ?? -1;
  const twin = youPick >= 0 && youPick === themPick;

  return (
    <Card
      style={{
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: last ? 0 : 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Text allowFontScaling={false} style={{ fontSize: 19, lineHeight: 24 }}>
          {prompt.emoji ?? '💬'}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            fontWeight: '700',
            lineHeight: 20,
            color: colors.ink,
            fontFamily: fontFamily.ui,
            flex: 1,
          }}
        >
          {prompt.question ?? ''}
        </Text>
        {twin && (
          <Text allowFontScaling={false} style={{ fontSize: 16, lineHeight: 20 }}>
            👯
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Kick c={colors.p1Deep} style={{ marginBottom: 6 }}>
            you
          </Kick>
          <Chip you soft>
            {youPick >= 0 ? prompt.options[youPick] : '—'}
          </Chip>
        </View>
        <View style={{ flex: 1 }}>
          <Kick c={colors.p2Deep} style={{ marginBottom: 6 }}>
            {partnerName}
          </Kick>
          <Chip soft>{themPick >= 0 ? prompt.options[themPick] : '—'}</Chip>
        </View>
      </View>
    </Card>
  );
}

export default function OnThisDayScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const { memory, prompts, answers, loading } = useOnThisDay();

  const handleBack = () => {
    safeBack(router);
  };

  // No real revealed history yet: the warm start-of-story state.
  if (!memory) {
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
              🌱
            </Text>
            <Serif s={32} italic c={colors.ink} style={{ textAlign: 'center' }}>
              your story starts today
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
              every reveal you two unlock becomes a memory here. play today's
              drop and this page starts filling up.
            </Text>
            <View style={{ width: '100%', marginTop: 14 }}>
              <Btn kind="soft" onPress={handleBack}>
                back to today
              </Btn>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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

      <TopBar title="on this day" onBack={handleBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ height: 62 }} />

          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: space.gutter,
              marginBottom: 8,
            }}
          >
            <Kick c={colors.inkMute}>{`${dayLabel(memory.date)} · ${memory.code}`}</Kick>
            <Serif s={36} italic c={colors.ink} style={{ marginTop: 10, textAlign: 'center' }}>
              remember this one?
            </Serif>
            <Serif s={24} c={colors.inkSoft} style={{ marginTop: 8, textAlign: 'center' }}>
              {memory.title}
            </Serif>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 10,
                marginTop: 14,
              }}
            >
              <GradientText
                style={{
                  fontSize: 54,
                  lineHeight: 59,
                  fontFamily: fontFamily.disp,
                  paddingRight: 2,
                }}
              >
                {`${memory.wavelength}%`}
              </GradientText>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  lineHeight: 20,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                in sync that day
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 16, paddingHorizontal: space.gutter }}>
            {prompts.length > 0 ? (
              prompts.map((p, i) => (
                <MemoryCompareCard
                  key={p.id}
                  prompt={p}
                  answer={answers[i]}
                  partnerName={partner.name}
                  last={i === prompts.length - 1}
                />
              ))
            ) : (
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 20,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {loading
                  ? 'finding your answers…'
                  : "couldn't load the answers right now — the memory is safe, try again in a bit."}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
