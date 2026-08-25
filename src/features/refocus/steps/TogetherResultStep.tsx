import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Peek } from '../../../components/Peek';
import Tok from '../../../components/Tok';
import Card from '../../../components/Card';
import Btn from '../../../components/Btn';
import { Kick, Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import EscalationCard from '../../../components/EscalationCard';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import {
  RefocusMediation,
  AI_DISCLOSURE,
  THERAPY_DISCLAIMER,
  SCREENING_UNAVAILABLE_NOTE,
} from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';
import { useCouple } from '../../pairing/useCouple';
import { addLearning } from '../../lovemap/addLearning';
import { useRefocusHistory } from '../useRefocusHistory';
import { checkShouldShowEscalationCard } from '../checkEscalation';
import type { RefocusSession } from '../../../types/db';
import { YOU, ResultSection, NeedCard } from './shared';

export function TogetherResultStep({
  insets,
  mediation,
  session,
  myId,
  onBack,
  onShowToast,
  onOpenLoveMap,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  mediation: RefocusMediation;
  session: RefocusSession;
  myId: string | null;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenLoveMap: () => void;
}) {
  const { partner } = useIdentity();
  const iAmInitiator = session.initiator === myId;
  const myUnderneath = iAmInitiator
    ? mediation.initiator_underneath
    : mediation.partner_underneath;
  const theirUnderneath = iAmInitiator
    ? mediation.partner_underneath
    : mediation.initiator_underneath;
  const myBridge = iAmInitiator
    ? mediation.initiator_bridge
    : mediation.partner_bridge;

  const [msg, setMsg] = useState(myBridge);
  const [copied, setCopied] = useState(false);
  const { couple } = useCouple();
  const { sessions: refocusHistory } = useRefocusHistory(couple?.id ?? null);

  const showEscalationCard =
    refocusHistory.length > 0 &&
    checkShouldShowEscalationCard(refocusHistory);

  const PAR = { name: partner.name, initial: partner.initial };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="the middle ground" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 40,
        }}
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Float distance={7} duration={4000}>
            <Peek size={84} mood="focus" />
          </Float>
          <Kick c={colors.matchDeep} style={{ marginTop: 8 }}>
            refocused, together
          </Kick>
          <Serif
            s={32}
            italic
            style={{
              marginTop: 8,
              marginBottom: 14,
              textAlign: 'center',
              maxWidth: 300,
              lineHeight: 32 * 1.09,
            }}
          >
            {`"${session.topic}"`}
          </Serif>
          <Text
            style={{
              fontSize: 13.5,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 290,
              lineHeight: 13.5 * 1.5,
              fontFamily: fontFamily.ui,
            }}
          >
            {`You're both looking at the same middle ground. Raw words stayed private, on both sides.`}
          </Text>
        </View>

        {/* Shared ground */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 20,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <Kick c={colors.p2Deep}>what you share underneath</Kick>
          <Text
            style={{
              fontSize: 15.5,
              color: colors.ink,
              lineHeight: 15.5 * 1.55,
              marginTop: 8,
              fontFamily: fontFamily.disp,
              fontStyle: 'italic',
            }}
          >
            {mediation.shared_ground}
          </Text>
        </Card>

        {/* Each side's underneath */}
        <ResultSection icon="💗" label="what's really underneath">
          <View style={{ gap: 12 }}>
            <NeedCard who={YOU} youSide text={myUnderneath} />
            <NeedCard who={PAR} text={theirUnderneath} />
          </View>
        </ResultSection>

        {/* My bridge */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 18,
            marginTop: 16,
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
            <Tok who={YOU} you size={22} />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '700',
                color: colors.ink,
                fontFamily: fontFamily.ui,
              }}
            >
              your bridge, if you want it
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9.5,
                letterSpacing: 0.1 * 9.5,
                color: colors.inkMute,
              }}
            >
              AI DRAFT · YOURS TO EDIT
            </Text>
          </View>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.inkSoft}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              backgroundColor: colors.sunken,
              paddingVertical: 13,
              paddingHorizontal: 14,
              fontSize: 14.5,
              lineHeight: 14.5 * 1.5,
              fontFamily: fontFamily.ui,
              color: colors.ink,
            }}
          />
          <View style={{ marginTop: 12 }}>
            <Btn
              kind={copied ? 'soft' : 'us'}
              onPress={async () => {
                await Clipboard.setStringAsync(msg);
                setCopied(true);
                onShowToast('Copied, share it when you’re ready 🤍');
              }}
              sub={`${partner.name} got their own bridge too`}
            >
              {copied ? 'Copied 🤍' : 'Copy to share'}
            </Btn>
          </View>
        </Card>

        {/* Love map capture — each of you saves your own underneath */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 18,
            marginTop: 16,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 17, color: colors.ink }}>🗺️</Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10.5,
                letterSpacing: 0.14 * 10.5,
                textTransform: 'uppercase',
                color: colors.p2Deep,
              }}
            >
              add it to your love map
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              color: colors.ink,
              lineHeight: 14 * 1.5,
              marginBottom: 14,
              fontFamily: fontFamily.ui,
            }}
          >
            Parallax will gently weave this into your next few drops, so next
            time, it&apos;s something you both just{' '}
            <Text style={{ fontStyle: 'italic' }}>know</Text>.
          </Text>
          <View style={{ gap: 10, marginBottom: 14 }}>
            <NeedCard who={YOU} youSide text={myUnderneath} />
          </View>
          <Btn
            kind="soft"
            onPress={async () => {
              if (myId && couple) {
                try {
                  await addLearning({
                    coupleId: couple.id,
                    aboutId: myId,
                    emoji: '🤍',
                    need: myUnderneath.split('\n')[0] || 'Underlying need',
                    detail: myUnderneath,
                    source: 'refocus',
                    // Stable per session + member (add_learning upserts on
                    // couple/about/origin) so re-taps never duplicate, and
                    // BOTH partners get their own entry.
                    origin: `refocus-session-${session.id}`,
                  });
                  onShowToast('Added to Love Map 🗺️');
                } catch {
                  onShowToast('Failed to save learnings');
                }
              }
              onOpenLoveMap();
            }}
            sub="see what you're learning"
          >
            Open your Love Map
          </Btn>
        </Card>

        {/* Escalation card: consider extra support (3+ in 30 days) */}
        {showEscalationCard && (
          <EscalationCard sessionCount={refocusHistory.length} />
        )}

        {/* Disclosure + disclaimer (+ the honest fail-open note) */}
        {mediation.screening_unavailable && (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 11.5,
              color: colors.inkSoft,
              marginTop: 20,
              lineHeight: 11.5 * 1.5,
              paddingHorizontal: 10,
              fontFamily: fontFamily.ui,
            }}
          >
            {SCREENING_UNAVAILABLE_NOTE}
          </Text>
        )}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: mediation.screening_unavailable ? 10 : 20,
            lineHeight: 11.5 * 1.5,
            paddingHorizontal: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          {AI_DISCLOSURE} {THERAPY_DISCLAIMER}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
