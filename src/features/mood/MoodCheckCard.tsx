import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { track, EVENTS } from '../../lib/analytics';
import Card from '../../components/Card';
import Press from '../../components/Press';
import { Kick } from '../../components/Text';
import { colors, radius, shadows } from '../../design/tokens';
import { fontFamily } from '../../design/typography';
import { MOODS, MOOD_COPY } from '../../content/mood';
import type { Mood } from '../../content/mood';
import { FLAGS, useFlag } from '../../lib/flags';
import { moodCardState } from './moodLogic';
import { useMoodCheck } from './useMoodCheck';

/**
 * V2 F1: the daily temperature greeting (V2_PLAN §10 — binding spec).
 * An inline card in the Today scroll between the hero and the drop card —
 * a greeting you pass, never a gate or a modal. A rough pick expands the card
 * in place with a quiet, explicit offer to enter Refocus. Behind f1_mood_check.
 */
export function MoodCheckCard({
  coupleId,
  userId,
  tz,
  playedToday,
  now,
}: {
  coupleId: string | null;
  userId: string | null;
  tz: string | null | undefined;
  playedToday: boolean;
  now?: () => Date;
}) {
  const router = useRouter();
  const flagOn = useFlag(FLAGS.F1_MOOD_CHECK);
  const {
    loading,
    mood,
    pickedThisSession,
    offerDismissedToday,
    pick,
    dismissOffer,
    suppressOfferToday,
  } = useMoodCheck({ coupleId, userId, tz, now });

  const state = moodCardState({
    flagOn,
    isLive: !!(coupleId && userId),
    playedToday,
    mood,
    pickedThisSession,
    offerDismissedToday,
  });

  // Tone canary numerator base: the greeting was actually shown (once per
  // mount — mood_check_shown vs mood_check gives the skip rate, §7).
  const shownTracked = useRef(false);
  useEffect(() => {
    if (loading || state.kind !== 'greeting' || shownTracked.current) return;
    shownTracked.current = true;
    track(EVENTS.MOOD_CHECK_SHOWN);
  }, [loading, state.kind]);

  if (loading) return null;
  if (state.kind === 'hidden') return null;

  const handleTalk = () => {
    // The offer served its purpose — never re-ask today (not a dismissal).
    suppressOfferToday();
    router.push('/refocus');
  };

  return (
    <Card
      style={{
        borderRadius: radius.cardLg,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
      }}
      testID="mood-check-card"
    >
      <Kick c={colors.inkMute}>{MOOD_COPY.kick}</Kick>

      {/* 4 day-word pills, one row — same option-pill language as the drop */}
      <View
        style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}
        accessibilityRole="radiogroup"
        accessibilityLabel={MOOD_COPY.kick}
      >
        {MOODS.map((m) => {
          const isSelected = mood === m.key;
          return (
            <Press
              key={m.key}
              onPress={() => pick(m.key as Mood)}
              scale
              accessibilityRole="radio"
              accessibilityLabel={m.label}
              accessibilityState={{ selected: isSelected }}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: isSelected ? colors.p2Deep : colors.surface,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.p2Deep : colors.line,
                ...(isSelected ? shadows.shadow : shadows.shadowSoft),
              }}
            >
              <Text style={{ fontSize: 17 }}>{m.emoji}</Text>
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '600',
                  color: isSelected ? '#fff' : colors.inkSoft,
                  fontFamily: fontFamily.ui,
                }}
              >
                {m.label}
              </Text>
            </Press>
          );
        })}
      </View>

      {state.kind === 'ack' && (
        <Text
          style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 18,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
          }}
        >
          {MOOD_COPY.ack}
        </Text>
      )}

      {state.kind === 'offer' && (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 14.5,
              lineHeight: 20,
              fontWeight: '600',
              color: colors.ink,
              fontFamily: fontFamily.ui,
            }}
          >
            {MOOD_COPY.offerLine}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Press
              onPress={handleTalk}
              scale={false}
              accessibilityRole="button"
              accessibilityLabel={MOOD_COPY.offerTalk}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.sunken,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.p2Deep,
                  fontFamily: fontFamily.ui,
                }}
              >
                {MOOD_COPY.offerTalk}
              </Text>
            </Press>
            <Press
              onPress={dismissOffer}
              scale={false}
              accessibilityRole="button"
              accessibilityLabel={MOOD_COPY.offerDismiss}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.inkMute,
                  fontFamily: fontFamily.ui,
                }}
              >
                {MOOD_COPY.offerDismiss}
              </Text>
            </Press>
          </View>
        </View>
      )}
    </Card>
  );
}
