import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import Card from '../../components/Card';
import Press from '../../components/Press';
import Tok from '../../components/Tok';
import { Kick, Serif } from '../../components/Text';
import { Ring } from '../../components/Ring';
import { colors, radius, shadows } from '../../design/tokens';
import { fontFamily } from '../../design/typography';
import { REPAIR_COPY, REPAIR_VERDICTS } from '../../content/repair';
import type { RepairVerdict } from '../../content/repair';
import { FLAGS, useFlag } from '../../lib/flags';
import { celebration, success } from '../../lib/haptics';
import { repairCardView } from './repairLogic';
import { useRepairCheckin } from './useRepairCheckin';

// Decorative ring sweep per outcome — choreography, never a score (no % shown).
const OUTCOME_RING = { repair: 100, getting_there: 62, tender: 33 } as const;

/**
 * V2 F2: the repair check-in on Today (V2_PLAN §10 — binding spec).
 * Drop-card visual weight: Card + Serif title + three option pills. Both
 * answer privately; the reveal is server-gated and reuses the drop-reveal
 * choreography scaled down. Mutual "yes" gets the milestone-warm treatment —
 * never confetti-scale. At 48h one-sided it transforms in place into a
 * private reflection note. Behind f2_repair_checkin.
 */
export function RepairCheckinCard({
  coupleId,
  userId,
  partnerName,
  myName,
  myInitial,
  partnerInitial,
}: {
  coupleId: string | null;
  userId: string | null;
  partnerName: string;
  myName: string;
  myInitial: string;
  partnerInitial: string;
}) {
  const router = useRouter();
  const flagOn = useFlag(FLAGS.F2_REPAIR_CHECKIN);
  const reducedMotion = useReducedMotion();
  const {
    loading,
    checkin,
    revealSeen,
    reflectionSaved,
    submit,
    markRevealSeen,
    saveReflection,
  } = useRepairCheckin(flagOn && coupleId && userId ? coupleId : null);

  const [note, setNote] = useState('');
  const [noteSavedNow, setNoteSavedNow] = useState(false);

  const view = repairCardView({
    flagOn,
    isLive: !!(coupleId && userId),
    checkin,
    revealSeen,
    reflectionSaved: reflectionSaved && !noteSavedNow,
  });

  // One warm haptic when the reveal first lands; celebration only for a repair.
  const hapticFired = useRef(false);
  useEffect(() => {
    if (view.kind !== 'reveal' || hapticFired.current) return;
    hapticFired.current = true;
    if (view.outcome === 'repair') celebration();
    else if (view.outcome === 'getting_there') success();
  }, [view]);

  if (loading || view.kind === 'hidden') return null;

  const verdictLabel = (v: RepairVerdict) =>
    REPAIR_VERDICTS.find((x) => x.key === v)?.label ?? v;

  return (
    <Card
      style={{
        borderRadius: radius.cardLg,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 14,
      }}
      testID="repair-checkin-card"
    >
      {view.kind === 'question' && (
        <>
          <Kick c={colors.p2Deep}>{REPAIR_COPY.kick}</Kick>
          <Serif s={24} italic c={colors.ink} style={{ marginTop: 8 }}>
            {REPAIR_COPY.title}
          </Serif>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
            }}
          >
            {REPAIR_COPY.sub}
          </Text>
          <View
            style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}
            accessibilityRole="radiogroup"
            accessibilityLabel={REPAIR_COPY.title}
          >
            {REPAIR_VERDICTS.map((v) => (
              <Press
                key={v.key}
                onPress={() => submit(v.key)}
                scale
                accessibilityRole="radio"
                accessibilityLabel={v.label}
                accessibilityState={{ selected: false }}
                style={{
                  flex: 1,
                  minHeight: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  paddingHorizontal: 4,
                  paddingVertical: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  ...shadows.shadowSoft,
                }}
              >
                <Text style={{ fontSize: 17 }}>{v.emoji}</Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '600',
                    color: colors.inkSoft,
                    fontFamily: fontFamily.ui,
                    textAlign: 'center',
                  }}
                >
                  {v.label}
                </Text>
              </Press>
            ))}
          </View>
        </>
      )}

      {view.kind === 'waiting' && (
        <>
          <Kick c={colors.p2Deep}>{REPAIR_COPY.kick}</Kick>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '600',
              color: colors.ink,
              fontFamily: fontFamily.ui,
            }}
          >
            {REPAIR_COPY.waiting(partnerName)}
          </Text>
        </>
      )}

      {view.kind === 'reveal' && (
        <>
          <Kick c={colors.matchDeep}>{REPAIR_COPY.revealKick}</Kick>
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Ring pct={OUTCOME_RING[view.outcome]} size={96} animate={!reducedMotion} />
          </View>

          {/* both answers, side by side */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {(
              [
                { who: { name: myName, initial: myInitial }, you: true, verdict: view.mine },
                { who: { name: partnerName, initial: partnerInitial }, you: false, verdict: view.theirs },
              ] as const
            ).map((side, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: colors.sunken,
                }}
              >
                <Tok who={side.who} you={side.you} size={26} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    fontWeight: '600',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {verdictLabel(side.verdict)}
                </Text>
              </View>
            ))}
          </View>

          {/* the one verdict line */}
          <Text
            style={{
              marginTop: 14,
              fontSize: 15.5,
              lineHeight: 22,
              color: colors.ink,
              fontFamily: fontFamily.disp,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            {view.outcome === 'repair' && `✨ ${REPAIR_COPY.repairLine}`}
            {view.outcome === 'getting_there' && REPAIR_COPY.gettingThereLine}
            {view.outcome === 'tender' && REPAIR_COPY.tenderLine}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {view.outcome === 'tender' && (
              <Press
                onPress={() => {
                  markRevealSeen();
                  router.push('/refocus');
                }}
                scale={false}
                accessibilityRole="button"
                accessibilityLabel={REPAIR_COPY.roundTwo}
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
                  {REPAIR_COPY.roundTwo}
                </Text>
              </Press>
            )}
            <Press
              onPress={markRevealSeen}
              scale={false}
              accessibilityRole="button"
              accessibilityLabel={REPAIR_COPY.dismiss}
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
                {REPAIR_COPY.dismiss}
              </Text>
            </Press>
          </View>
        </>
      )}

      {view.kind === 'reflection' && !noteSavedNow && (
        <>
          <Kick c={colors.p2Deep}>{REPAIR_COPY.reflectionKick}</Kick>
          <Serif s={22} italic c={colors.ink} style={{ marginTop: 8 }}>
            {REPAIR_COPY.reflectionPrompt}
          </Serif>
          <Text
            style={{
              marginTop: 6,
              fontSize: 12.5,
              lineHeight: 17,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
            }}
          >
            {REPAIR_COPY.reflectionSub}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="say it however it comes…"
            placeholderTextColor={colors.inkSoft}
            accessibilityLabel={REPAIR_COPY.reflectionPrompt}
            style={{
              marginTop: 10,
              minHeight: 72,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 14,
              backgroundColor: colors.sunken,
              paddingVertical: 10,
              paddingHorizontal: 12,
              fontSize: 14.5,
              lineHeight: 20,
              color: colors.ink,
              fontFamily: fontFamily.ui,
            }}
          />
          <Press
            onPress={async () => {
              const ok = await saveReflection(note);
              if (ok) setNoteSavedNow(true);
            }}
            scale={false}
            accessibilityRole="button"
            accessibilityLabel={REPAIR_COPY.reflectionSave}
            style={{
              marginTop: 10,
              minHeight: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: note.trim() ? colors.p2Deep : colors.sunken,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: note.trim() ? '#fff' : colors.inkMute,
                fontFamily: fontFamily.ui,
              }}
            >
              {REPAIR_COPY.reflectionSave}
            </Text>
          </Press>
        </>
      )}

      {noteSavedNow && (
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '600',
            color: colors.ink,
            fontFamily: fontFamily.ui,
          }}
        >
          {REPAIR_COPY.reflectionSaved}
        </Text>
      )}
    </Card>
  );
}
