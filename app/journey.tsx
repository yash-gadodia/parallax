import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, radius, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';
import TopBar from '../src/components/TopBar';
import Card from '../src/components/Card';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { Skeleton } from '../src/components/Skeleton';
import { useUiStore } from '../src/store/ui';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { useIdentity } from '../src/features/profile/useIdentity';
import { useJourneyState } from '../src/features/journeys/useJourneyState';
import {
  recordJourneyCheckin,
  advanceJourneyStage,
} from '../src/features/journeys/journeyActions';
import {
  parseTalkPrompts,
  stageProgressLabel,
  canAdvance,
  checkinStatusLine,
  SAMPLE_JOURNEY,
  SAMPLE_JOURNEY_STATE,
} from '../src/features/journeys/journeyLogic';
import type { JourneyState, JourneyTalkPrompt } from '../src/types/db';

interface StageView {
  position: number;
  emoji: string;
  title: string;
  kick: string | null;
  description: string | null;
  talkPrompts: JourneyTalkPrompt[];
  checkinPrompt: string;
}

export default function JourneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { couple } = useCouple();
  const { partner } = useIdentity();
  const isLive = !!(session && couple);
  const {
    state: liveState,
    stages: liveStages,
    loading,
    error,
    refetch,
  } = useJourneyState(session && couple ? couple.id : null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const handleBack = () => {
    safeBack(router);
  };

  // Demo falls back to the sample preview (the isSample pattern) — clearly
  // labelled, read-only, never pretending to be server data.
  const state: JourneyState | null = isLive ? liveState : SAMPLE_JOURNEY_STATE;
  const stageViews: StageView[] = isLive
    ? liveStages.map((s) => ({
        position: s.position,
        emoji: s.emoji ?? '🧭',
        title: s.title,
        kick: s.kick,
        description: s.description,
        talkPrompts: parseTalkPrompts(s.talk_prompts),
        checkinPrompt: s.checkin_prompt,
      }))
    : SAMPLE_JOURNEY.stages.map((s) => ({
        position: s.position,
        emoji: s.emoji,
        title: s.title,
        kick: s.kick,
        description: s.description,
        talkPrompts: s.talk_prompts,
        checkinPrompt: s.checkin_prompt,
      }));

  const stageCount = state?.stage_count ?? stageViews.length;
  const currentPos = state?.current_stage ?? 1;
  const completed = !!state?.completed_at;
  const currentStage =
    stageViews.find((s) => s.position === currentPos) ?? null;

  const handleCheckin = async () => {
    if (!isLive || !state?.couple_journey_id || busy) return;
    setBusy(true);
    try {
      const trimmed = note.trim();
      await recordJourneyCheckin(state.couple_journey_id, trimmed || null);
      setNote('');
      useUiStore.getState().fireToast('checked in ✓');
      refetch();
    } catch {
      useUiStore
        .getState()
        .fireToast("couldn't save your check-in — try again in a bit");
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = async () => {
    if (!isLive || !state?.couple_journey_id || busy) return;
    setBusy(true);
    try {
      const result = await advanceJourneyStage(state.couple_journey_id);
      useUiStore
        .getState()
        .fireToast(result.completed ? 'journey complete 🎉' : "new era. let's go");
      refetch();
    } catch (err) {
      // The server gate (0028: 'check in on this stage before moving on') can
      // fire even when the local state looked advanceable — a stale check-in
      // flag. Surface the real reason warmly, not a generic try-again.
      const message = (err as { message?: string } | null)?.message ?? '';
      useUiStore
        .getState()
        .fireToast(
          message.includes('check in on this stage')
            ? 'check in on this stage first — then it unlocks'
            : "couldn't move the stage — try again in a bit"
        );
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const statusLine = checkinStatusLine(state, partner.name);

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
        <TopBar title="YOUR JOURNEY" onBack={handleBack} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingTop: 52 + 8,
            paddingBottom: insets.bottom + space.gutter,
          }}
        >
          {isLive && loading ? (
            <View style={{ gap: 12, marginTop: 6 }} testID="journey-skeleton">
              <Skeleton h={120} br={radius.card} />
              <Skeleton h={20} w="42%" />
              <Skeleton h={220} br={radius.card} />
            </View>
          ) : isLive && error ? (
            <Card
              style={{
                borderRadius: radius.card,
                padding: 20,
                alignItems: 'center',
                gap: 10,
                marginTop: 6,
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
                couldn&apos;t reach your journey right now — your place is safe,
                try again in a bit.
              </Text>
              <Btn kind="soft" onPress={refetch} style={{ alignSelf: 'stretch' }}>
                try again
              </Btn>
            </Card>
          ) : isLive && (!state || !state.exists) ? (
            <View
              style={{
                alignItems: 'center',
                gap: 12,
                marginTop: 60,
                paddingHorizontal: 8,
              }}
            >
              <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
                🧭
              </Text>
              <Serif s={30} italic c={colors.ink} style={{ textAlign: 'center' }}>
                no journey yet
              </Serif>
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
                pick a milestone you two are living and walk it stage by stage.
              </Text>
              <Btn
                kind="us"
                onPress={() => router.push('/journeys')}
                style={{ alignSelf: 'stretch', marginTop: 8 }}
              >
                Browse journeys →
              </Btn>
            </View>
          ) : (
            <>
              {!isLive && (
                <Kick c={colors.p2Deep} style={{ marginTop: 6, marginBottom: 10 }}>
                  sample preview · pair up to walk it for real
                </Kick>
              )}

              {/* Journey header */}
              <Card
                style={{
                  borderRadius: radius.card,
                  overflow: 'hidden',
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                }}
              >
                <LinearGradient
                  colors={gradients.us.colors}
                  locations={gradients.us.locations}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingHorizontal: 18, paddingVertical: 16 }}
                >
                  <Text allowFontScaling={false} style={{ fontSize: 30, lineHeight: 36 }}>
                    {state?.emoji ?? '🧭'}
                  </Text>
                  <Serif s={30} italic c="#fff" style={{ marginTop: 4 }}>
                    {state?.title ?? ''}
                  </Serif>
                  <Kick c="rgba(255,255,255,0.88)" style={{ marginTop: 7 }}>
                    {stageProgressLabel(currentPos, stageCount, completed)}
                  </Kick>
                </LinearGradient>

                {/* Progress dots */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                  }}
                  testID="journey-progress"
                >
                  {Array.from({ length: stageCount }, (_, i) => {
                    const pos = i + 1;
                    const done = completed || pos < currentPos;
                    const current = !completed && pos === currentPos;
                    return (
                      <View
                        key={pos}
                        style={{
                          flex: 1,
                          height: current ? 8 : 6,
                          borderRadius: radius.pill,
                          backgroundColor: done
                            ? colors.match
                            : current
                              ? colors.p2Deep
                              : colors.sunken,
                        }}
                      />
                    );
                  })}
                </View>
              </Card>

              {completed ? (
                <Card
                  style={{
                    borderRadius: radius.card,
                    padding: 20,
                    alignItems: 'center',
                    gap: 10,
                    marginTop: space.gap,
                  }}
                >
                  <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 50 }}>
                    🎉
                  </Text>
                  <Serif s={28} italic c={colors.ink} style={{ textAlign: 'center' }}>
                    you walked the whole thing
                  </Serif>
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
                    every stage, both of you. the flat has your names on it —
                    and so does this.
                  </Text>
                </Card>
              ) : currentStage ? (
                <Card
                  style={{
                    borderRadius: radius.card,
                    padding: 18,
                    marginTop: space.gap,
                  }}
                >
                  <Text allowFontScaling={false} style={{ fontSize: 30, lineHeight: 36 }}>
                    {currentStage.emoji}
                  </Text>
                  {currentStage.kick ? (
                    <Kick c={colors.p2Deep} style={{ marginTop: 8 }}>
                      {currentStage.kick}
                    </Kick>
                  ) : null}
                  <Serif s={28} c={colors.ink} style={{ marginTop: 6 }}>
                    {currentStage.title}
                  </Serif>
                  {currentStage.description ? (
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 14.5,
                        lineHeight: 21,
                        color: colors.inkSoft,
                        fontFamily: fontFamily.ui,
                        marginTop: 8,
                      }}
                    >
                      {currentStage.description}
                    </Text>
                  ) : null}

                  {currentStage.talkPrompts.length > 0 && (
                    <View style={{ marginTop: 16, gap: 8 }}>
                      <Kick c={colors.inkMute}>align on these</Kick>
                      {currentStage.talkPrompts.map((p, i) => (
                        <View
                          key={i}
                          style={{
                            flexDirection: 'row',
                            gap: 10,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: radius.tile,
                            backgroundColor: colors.sunken,
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{ fontSize: 17, lineHeight: 22 }}
                          >
                            {p.emoji}
                          </Text>
                          <Text
                            allowFontScaling={false}
                            style={{
                              flex: 1,
                              fontSize: 13.5,
                              lineHeight: 19,
                              color: colors.ink,
                              fontFamily: fontFamily.ui,
                            }}
                          >
                            {p.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Stage check-in */}
                  <View style={{ marginTop: 18, gap: 10 }}>
                    <Kick c={colors.inkMute}>stage check-in</Kick>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 15,
                        lineHeight: 21,
                        fontWeight: '600',
                        color: colors.ink,
                        fontFamily: fontFamily.ui,
                      }}
                    >
                      {currentStage.checkinPrompt}
                    </Text>

                    {isLive && !state?.i_checked_in && (
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="say it here (optional)"
                        placeholderTextColor={colors.inkMute}
                        maxLength={280}
                        style={{
                          borderRadius: radius.input,
                          backgroundColor: colors.sunken,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          fontSize: 14,
                          lineHeight: 19,
                          color: colors.ink,
                          fontFamily: fontFamily.ui,
                        }}
                        accessibilityLabel="Check-in note"
                      />
                    )}

                    {statusLine ? (
                      <Kick c={colors.matchDeep}>{statusLine}</Kick>
                    ) : null}

                    {isLive ? (
                      <>
                        {!state?.i_checked_in && (
                          <Btn
                            kind="soft"
                            onPress={handleCheckin}
                            disabled={busy}
                            sub="marks this stage talked-about"
                          >
                            Check in on this stage
                          </Btn>
                        )}
                        <Btn
                          kind="us"
                          onPress={handleAdvance}
                          disabled={busy || !canAdvance(state)}
                          sub={
                            canAdvance(state)
                              ? 'when life moves, move the stage'
                              : 'check in first — then this unlocks'
                          }
                        >
                          {currentPos >= stageCount
                            ? 'Finish the journey 🎉'
                            : "We've moved on → next stage"}
                        </Btn>
                      </>
                    ) : (
                      <Btn
                        kind="us"
                        onPress={() => router.push('/signup')}
                        sub="your stages, your pace"
                      >
                        Make it yours →
                      </Btn>
                    )}
                  </View>
                </Card>
              ) : null}

              {/* The full track — where you've been, where this goes */}
              <Card
                style={{
                  borderRadius: radius.card,
                  padding: 18,
                  marginTop: space.gap,
                  gap: 10,
                }}
              >
                <Kick c={colors.inkMute}>the whole track</Kick>
                {stageViews.map((s) => {
                  const done = completed || s.position < currentPos;
                  const current = !completed && s.position === currentPos;
                  return (
                    <View
                      key={s.position}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ fontSize: 17, lineHeight: 22, opacity: done || current ? 1 : 0.45 }}
                      >
                        {s.emoji}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          flex: 1,
                          fontSize: 14,
                          lineHeight: 19,
                          fontWeight: current ? '700' : '500',
                          color: done || current ? colors.ink : colors.inkMute,
                          fontFamily: fontFamily.ui,
                        }}
                      >
                        {s.title}
                      </Text>
                      {done ? (
                        <Kick c={colors.matchDeep}>done ✓</Kick>
                      ) : current ? (
                        <Kick c={colors.p2Deep}>now</Kick>
                      ) : null}
                    </View>
                  );
                })}
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
