import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import Press from '../src/components/Press';
import Btn from '../src/components/Btn';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import { Icon, ICONS } from '../src/components/Icon';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { Skeleton } from '../src/components/Skeleton';
import { useUiStore } from '../src/store/ui';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { useJourneys } from '../src/features/journeys/useJourneys';
import type { JourneyListItem } from '../src/features/journeys/useJourneys';
import { useJourneyState } from '../src/features/journeys/useJourneyState';
import { enrollJourney } from '../src/features/journeys/journeyActions';
import { stageProgressLabel } from '../src/features/journeys/journeyLogic';

export default function JourneysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { couple } = useCouple();
  const { journeys, loading, isSample, error, refetch } = useJourneys();
  const { state, refetch: refetchState } = useJourneyState(
    session && couple ? couple.id : null
  );
  const [enrolling, setEnrolling] = useState(false);

  const handleBack = () => {
    safeBack(router);
  };

  const handleStart = async (journey: JourneyListItem) => {
    if (!session || !couple) {
      // Demo: the journey screen previews the sample honestly.
      router.push('/journey');
      return;
    }
    if (enrolling) return;
    setEnrolling(true);
    try {
      await enrollJourney(couple.id, journey.id);
      refetchState();
      router.push('/journey');
    } catch {
      useUiStore
        .getState()
        .fireToast("couldn't start the journey — try again in a bit");
    } finally {
      setEnrolling(false);
    }
  };

  const enrolledJourneyId = state?.exists ? state.journey_id : undefined;

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="JOURNEYS" onBack={handleBack} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 52 + 8,
            paddingBottom: insets.bottom + space.gutter,
          }}
        >
          <View style={{ marginTop: 6, marginBottom: 6 }}>
            <Serif s={40} c={colors.ink}>
              Journeys
            </Serif>
          </View>

          <Text
            allowFontScaling={false}
            style={{
              fontSize: 15,
              lineHeight: 15 * 1.47,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              marginBottom: 20,
            }}
          >
            companions for the big eras — a stage at a time, with the
            conversations that keep you two on the same page through it.
          </Text>

          {isSample && (
            <Kick c={colors.p2Deep} style={{ marginBottom: 12 }}>
              sample preview · pair up to walk one for real
            </Kick>
          )}

          {loading ? (
            <Card
              style={{
                borderRadius: radius.card,
                padding: 18,
                gap: 12,
              }}
              testID="journeys-skeleton"
            >
              <Skeleton h={34} w="20%" />
              <Skeleton h={28} w="66%" />
              <Skeleton h={16} w="88%" />
              <Skeleton h={44} />
            </Card>
          ) : error ? (
            <Card
              style={{
                borderRadius: radius.card,
                padding: 20,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text allowFontScaling={false} style={{ fontSize: 34, lineHeight: 40 }}>
                🌧
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  lineHeight: 21,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                }}
              >
                couldn&apos;t reach the journeys right now — nothing&apos;s lost,
                try again in a bit.
              </Text>
              <Btn kind="soft" onPress={refetch} style={{ alignSelf: 'stretch' }}>
                try again
              </Btn>
            </Card>
          ) : journeys.length === 0 ? (
            <Card
              style={{
                borderRadius: radius.card,
                padding: 20,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text allowFontScaling={false} style={{ fontSize: 34, lineHeight: 40 }}>
                🌱
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  lineHeight: 21,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                }}
              >
                journeys are still being written — the first one lands here soon.
              </Text>
            </Card>
          ) : (
            journeys.map((journey) => {
              const enrolled = enrolledJourneyId === journey.id;
              const completed = enrolled && !!state?.completed_at;
              return (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  enrolled={enrolled}
                  progressLabel={
                    enrolled
                      ? stageProgressLabel(
                          state?.current_stage ?? 1,
                          state?.stage_count ?? journey.stageCount,
                          completed
                        )
                      : null
                  }
                  onOpen={() => router.push('/journey')}
                  onStart={() => handleStart(journey)}
                  starting={enrolling}
                />
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function JourneyCard({
  journey,
  enrolled,
  progressLabel,
  onOpen,
  onStart,
  starting,
}: {
  journey: JourneyListItem;
  enrolled: boolean;
  progressLabel: string | null;
  onOpen: () => void;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <Card
      style={{
        borderRadius: radius.card,
        overflow: 'hidden',
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginBottom: space.gap,
      }}
    >
      <LinearGradient
        colors={gradients.us.colors}
        locations={gradients.us.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 18, paddingVertical: 16 }}
      >
        <Text allowFontScaling={false} style={{ fontSize: 34, lineHeight: 40 }}>
          {journey.emoji ?? '🧭'}
        </Text>
        <Serif s={30} italic c="#fff" style={{ marginTop: 6 }}>
          {journey.title}
        </Serif>
        {journey.tagline ? (
          <Kick c="rgba(255,255,255,0.88)" style={{ marginTop: 7 }}>
            {journey.tagline}
          </Kick>
        ) : null}
      </LinearGradient>

      <View style={{ paddingHorizontal: 18, paddingVertical: 16, gap: 12 }}>
        {journey.description ? (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
            }}
          >
            {journey.description}
          </Text>
        ) : null}

        <Kick c={colors.inkMute}>
          {journey.stageCount} stages · move at your own pace
        </Kick>

        {enrolled ? (
          <Press onPress={onOpen} accessibilityLabel={`Open ${journey.title}`}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: radius.tile,
                backgroundColor: colors.sunken,
                ...shadows.shadowSoft,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    lineHeight: 19,
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {progressLabel === 'complete'
                    ? 'you walked the whole thing 🎉'
                    : "you're on this one"}
                </Text>
                <Kick c={colors.p2Deep} style={{ marginTop: 3 }}>
                  {progressLabel ?? ''} · open it →
                </Kick>
              </View>
              <Icon d={ICONS.chevR} size={17} color={colors.p2Deep} />
            </View>
          </Press>
        ) : (
          <Btn kind="us" onPress={onStart} disabled={starting} sub="walk it together">
            Start this journey
          </Btn>
        )}
      </View>
    </Card>
  );
}
