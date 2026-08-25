import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Peek } from '../../../components/Peek';
import Tok from '../../../components/Tok';
import { Icon, ICONS } from '../../../components/Icon';
import Card from '../../../components/Card';
import Btn from '../../../components/Btn';
import { Kick, Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, radius, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import {
  RefocusResult,
  AI_DISCLOSURE,
  THERAPY_DISCLAIMER,
  SCREENING_UNAVAILABLE_NOTE,
} from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';
import { useSession } from '../../auth/useSession';
import { useCouple } from '../../pairing/useCouple';
import { addLearning } from '../../lovemap/addLearning';
import { learningOrigin } from '../../../domain/learningOrigin';
import { markBridgeSent } from '../refocusActions';
import { YOU, ResultSection, NeedCard } from './shared';

export interface ResultStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  result: RefocusResult;
  soloSessionId: string | null;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenLoveMap: () => void;
}

export function ResultStep({
  insets,
  result,
  soloSessionId,
  onBack,
  onShowToast,
  onOpenLoveMap,
}: ResultStepProps) {
  const { partner } = useIdentity();
  const [msg, setMsg] = useState(result.bridge);
  const [copied, setCopied] = useState(false);
  const [savingLearnings, setSavingLearnings] = useState(false);
  const { session } = useSession();
  const { couple } = useCouple();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="back in focus" onBack={onBack} />
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
            refocused
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
            Your side, in focus.
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
            {`Nothing here was sent to ${partner.name}. What you share, and when, is up to you.`}
          </Text>
        </View>

        {/* What happened */}
        <ResultSection icon="🧭" label="what happened">
          <View style={{ gap: 9 }}>
            {result.happened.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: radius.pill,
                    backgroundColor: 'rgba(84,194,160,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon d={ICONS.check} size={11} color={colors.matchDeep} sw={2.6} />
                </View>
                <Text
                  style={{
                    fontSize: 14.5,
                    color: colors.ink,
                    fontWeight: '600',
                    lineHeight: 14.5 * 1.4,
                    flex: 1,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {a}
                </Text>
              </View>
            ))}
          </View>
        </ResultSection>

        {/* Other angles it might look from */}
        <ResultSection icon="👀" label="other angles it might look from">
          <Text
            style={{
              fontSize: 12.5,
              color: colors.inkSoft,
              marginBottom: 12,
              lineHeight: 12.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`Possibilities to sit with, not ${partner.name}'s actual words.`}
          </Text>
          <View style={{ gap: 12 }}>
            {result.angles.map((a, i) => (
              <PossibilityCard key={i} text={a} />
            ))}
          </View>
        </ResultSection>

        {/* What's really underneath */}
        <ResultSection icon="💗" label="what's really underneath">
          <NeedCard who={YOU} youSide text={result.underneath} />
        </ResultSection>

        {/* A way to raise it */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 20,
            marginTop: 16,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.25)',
          }}
        >
          <Kick c={colors.p2Deep}>a way to raise it</Kick>
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
            {result.wayback}
          </Text>
        </Card>

        {/* Bridge message */}
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
              {`Want to say it to ${partner.name}?`}
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
                // V2 F2: the bridge is on its way — the repair check-in
                // becomes due 24h from now (fire-and-forget, idempotent).
                if (soloSessionId) markBridgeSent(soloSessionId);
              }}
              sub="paste it anywhere you two talk"
            >
              {copied ? 'Copied 🤍' : 'Copy to share'}
            </Btn>
          </View>
        </Card>

        {/* Love map capture */}
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
              added to your love map
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
            <NeedCard who={YOU} youSide text={result.underneath} />
          </View>
          <Btn
            kind="soft"
            onPress={async () => {
              if (session && couple) {
                try {
                  setSavingLearnings(true);

                  // Stable origin derived from this reflection's content, so
                  // re-tapping "Open your Love Map" upserts the same learning
                  // instead of creating duplicates each time.
                  const origin = 'refocus-' + learningOrigin(result.happened, result.wayback);

                  if (result.underneath) {
                    await addLearning({
                      coupleId: couple.id,
                      aboutId: session.user.id,
                      emoji: '🤍',
                      need: result.underneath.split('\n')[0] || 'Underlying need',
                      detail: result.underneath,
                      source: 'refocus',
                      origin,
                    });
                  }

                  onShowToast('Added to Love Map 🗺️');
                  setSavingLearnings(false);
                } catch (err) {
                  onShowToast('Failed to save learnings');
                  setSavingLearnings(false);
                }
              }
              onOpenLoveMap();
            }}
            sub="see what you're learning"
          >
            Open your Love Map
          </Btn>
        </Card>

        {/* Disclosure + disclaimer (+ the honest fail-open note) */}
        {result.screening_unavailable && (
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
            marginTop: result.screening_unavailable ? 10 : 20,
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

function PossibilityCard({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 16,
        backgroundColor: 'rgba(157,149,245,0.09)',
        borderLeftWidth: 3,
        borderLeftColor: colors.p2,
      }}
    >
      <Kick c={colors.p2Deep} style={{ marginBottom: 4 }}>
        one possibility
      </Kick>
      <Text
        style={{
          fontSize: 14,
          color: colors.ink,
          lineHeight: 14 * 1.45,
          fontFamily: fontFamily.ui,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
