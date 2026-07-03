import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/lib/nav';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import TopBar from '../src/components/TopBar';
import Btn from '../src/components/Btn';
import Card from '../src/components/Card';
import { DawnBlobs } from '../src/components/DawnBlobs';
import { useIdentity } from '../src/features/profile/useIdentity';
import { useMoneyDate } from '../src/features/moneyDates/useMoneyDate';
import {
  startMoneyDate,
  advanceMoneyDate,
  completeMoneyDate,
} from '../src/features/moneyDates/moneyDateActions';
import {
  MONEY_DATE_CARDS,
  AGREED_ACTION_MAX,
  CARD_NOTE_MAX,
  clampStep,
} from '../src/features/moneyDates/cards';

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

const inputStyle = {
  borderWidth: 1.5,
  borderColor: colors.line,
  borderRadius: 18,
  backgroundColor: colors.surface,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  lineHeight: 21,
  color: colors.ink,
  fontFamily: fontFamily.ui,
} as const;

type Phase = 'intro' | 'cards' | 'action' | 'done';

export default function MoneyDateScreen() {
  const router = useRouter();
  const { partner } = useIdentity();
  const { state, coupleId, loading, isSample, error, refetch } = useMoneyDate();

  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const handleBack = () => {
    safeBack(router);
  };

  const jumpToStep = (step: number) => {
    const s = clampStep(step);
    if (s >= MONEY_DATE_CARDS.length) {
      setPhase('action');
    } else {
      setIdx(s);
      setPhase('cards');
    }
  };

  const handleStart = async () => {
    setStepError(null);
    if (isSample || !coupleId) {
      jumpToStep(0);
      return;
    }
    setBusy(true);
    try {
      const id = await startMoneyDate(coupleId);
      setSessionId(id);
      // Resuming a fresh open session drops you back on its card.
      jumpToStep(state?.open && state.open.id === id ? state.open.step : 0);
    } catch {
      setStepError("couldn't open your money date — give it another go.");
    } finally {
      setBusy(false);
    }
  };

  const handleNextCard = async () => {
    setStepError(null);
    const trimmed = note.trim();
    if (isSample || !sessionId) {
      setNote('');
      jumpToStep(idx + 1);
      return;
    }
    setBusy(true);
    try {
      const nextStep = await advanceMoneyDate(sessionId, trimmed === '' ? null : trimmed);
      setNote('');
      jumpToStep(nextStep);
    } catch {
      // The note stays in the box — nothing is lost, they just try again.
      setStepError("that card didn't save — try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setStepError(null);
    const trimmed = action.trim();
    if (trimmed === '') return;
    if (isSample || !sessionId) {
      setPhase('done');
      return;
    }
    setBusy(true);
    try {
      await completeMoneyDate(sessionId, trimmed);
      setPhase('done');
    } catch {
      setStepError("couldn't save your tiny thing — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Frame>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Kick c={colors.inkSoft}>setting the table…</Kick>
        </SafeAreaView>
      </Frame>
    );
  }

  // A real couple whose state fetch failed: honest and retryable, never fake.
  if (error && !isSample) {
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
              🫧
            </Text>
            <Serif s={30} italic c={colors.ink} style={{ textAlign: 'center' }}>
              couldn't load your money date
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
              nothing's lost — this is just a connection hiccup.
            </Text>
            <View style={{ width: '100%', marginTop: 14, gap: 10 }}>
              <Btn kind="ink" onPress={refetch}>
                try again
              </Btn>
              <Btn kind="soft" onPress={handleBack}>
                back
              </Btn>
            </View>
          </View>
        </SafeAreaView>
      </Frame>
    );
  }

  if (phase === 'intro') {
    const resuming = !isSample && !!state?.open;
    return (
      <Frame>
        <TopBar title="money date" onBack={handleBack} />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: space.gutter,
              paddingTop: 62,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
          >
            {isSample && (
              <Kick c={colors.p2Deep} style={{ textAlign: 'center', marginBottom: 14 }}>
                demo · nothing is saved
              </Kick>
            )}
            <Text
              allowFontScaling={false}
              style={{ fontSize: 52, lineHeight: 58, textAlign: 'center', color: colors.ink }}
            >
              ☕
            </Text>
            <Serif s={36} italic style={{ textAlign: 'center', marginTop: 10 }}>
              money date
            </Serif>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: colors.inkSoft,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              {`grab ${partner.name} — one phone, five minutes, zero numbers. four little cards to talk through, then you pick one tiny thing to try.`}
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 13,
                lineHeight: 19,
                color: colors.inkMute,
                fontFamily: fontFamily.ui,
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              not budgeting. not advice. just the two of you, talking.
            </Text>
            {stepError && (
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 13.5,
                  lineHeight: 19,
                  color: colors.p1Deep,
                  fontFamily: fontFamily.ui,
                  textAlign: 'center',
                  marginTop: 14,
                }}
              >
                {stepError}
              </Text>
            )}
            <View style={{ marginTop: 26, gap: 10 }}>
              <Btn kind="us" onPress={handleStart} disabled={busy}>
                {resuming ? 'pick up where you left off →' : "we're both here →"}
              </Btn>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Frame>
    );
  }

  if (phase === 'cards') {
    const card = MONEY_DATE_CARDS[idx];
    const isLastCard = idx === MONEY_DATE_CARDS.length - 1;
    return (
      <Frame>
        <TopBar title="money date" onBack={handleBack} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: space.gutter,
                paddingTop: 62,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <Kick c={colors.p2Deep}>
                  {isSample ? 'demo · nothing is saved' : 'together · one phone'}
                </Kick>
                <Kick>
                  {idx + 1}/{MONEY_DATE_CARDS.length}
                </Kick>
              </View>

              <Text
                allowFontScaling={false}
                style={{ fontSize: 50, lineHeight: 56, marginBottom: 8, color: colors.ink }}
              >
                {card.emoji}
              </Text>
              <Kick c={colors.inkMute}>{card.title}</Kick>
              <Serif s={32} style={{ marginTop: 6, marginBottom: 12 }}>
                {card.question}
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  lineHeight: 21,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  marginBottom: 22,
                }}
              >
                {card.hint}
              </Text>

              <Kick c={colors.inkMute} style={{ marginBottom: 8 }}>
                keep a line from this · optional
              </Kick>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="something one of you said…"
                placeholderTextColor={colors.inkMute}
                multiline
                maxLength={CARD_NOTE_MAX}
                style={{ ...inputStyle, minHeight: 76 }}
                accessibilityLabel="Keep a line from this card (optional)"
              />

              {stepError && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 19,
                    color: colors.p1Deep,
                    fontFamily: fontFamily.ui,
                    marginTop: 12,
                  }}
                >
                  {stepError}
                </Text>
              )}

              <View style={{ marginTop: 18 }}>
                <Btn kind="ink" onPress={handleNextCard} disabled={busy}>
                  {isLastCard ? 'last bit: pick your tiny thing →' : 'next card →'}
                </Btn>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Frame>
    );
  }

  if (phase === 'action') {
    const trimmed = action.trim();
    return (
      <Frame>
        <TopBar title="money date" onBack={handleBack} />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: space.gutter,
                paddingTop: 62,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Kick c={colors.p2Deep} style={{ marginBottom: 18 }}>
                {isSample ? 'demo · nothing is saved' : 'the finale'}
              </Kick>
              <Text
                allowFontScaling={false}
                style={{ fontSize: 50, lineHeight: 56, marginBottom: 8, color: colors.ink }}
              >
                🤝
              </Text>
              <Serif s={32} style={{ marginBottom: 12 }}>
                one tiny thing you'll both try
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14.5,
                  lineHeight: 21,
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  marginBottom: 22,
                }}
              >
                say it out loud, agree on it, write it down. tiny beats grand —
                "cook in on fridays" counts.
              </Text>

              <TextInput
                value={action}
                onChangeText={setAction}
                placeholder="our one tiny thing…"
                placeholderTextColor={colors.inkMute}
                multiline
                maxLength={AGREED_ACTION_MAX}
                style={{ ...inputStyle, minHeight: 76 }}
                accessibilityLabel="Your one tiny agreed action"
              />
              <Kick c={colors.inkMute} style={{ marginTop: 8 }}>
                {`${trimmed.length}/${AGREED_ACTION_MAX}`}
              </Kick>

              {stepError && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 19,
                    color: colors.p1Deep,
                    fontFamily: fontFamily.ui,
                    marginTop: 12,
                  }}
                >
                  {stepError}
                </Text>
              )}

              <View style={{ marginTop: 18 }}>
                <Btn kind="us" onPress={handleComplete} disabled={busy || trimmed === ''}>
                  lock it in ✨
                </Btn>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Frame>
    );
  }

  // done
  return (
    <Frame>
      <TopBar title="money date" onBack={handleBack} />
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
            🥂
          </Text>
          <Serif s={34} italic style={{ textAlign: 'center' }}>
            that's a money date
          </Serif>
          <Card
            style={{
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 16,
              alignSelf: 'stretch',
            }}
          >
            <Kick c={colors.inkMute}>your tiny thing</Kick>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 16,
                lineHeight: 23,
                color: colors.ink,
                fontFamily: fontFamily.disp,
                marginTop: 6,
              }}
            >
              {action.trim() || 'talk again soon'}
            </Text>
          </Card>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            {isSample
              ? 'this was the demo — pair up and it saves to your story.'
              : `saved to your story. same time next month, ${partner.name}'s call.`}
          </Text>
          <View style={{ width: '100%', marginTop: 14 }}>
            <Btn kind="soft" onPress={handleBack} testID="money-date-done">
              done
            </Btn>
          </View>
        </View>
      </SafeAreaView>
    </Frame>
  );
}
