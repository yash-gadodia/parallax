import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import TopBar from '../../../components/TopBar';
import Press from '../../../components/Press';
import { colors } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import {
  WORKING_STAGES,
  WORKING_CONSIDERED,
} from '../../../content/refocus';
import { analyzeV2, SoloV2Outcome } from '../refocusActions';
import { PulseDot } from './shared';

export interface WorkingStepProps {
  userText: string;
  pastedChat: string | null;
  onDone: (outcome: SoloV2Outcome) => void;
  onError: () => void;
  onCancel: () => void;
  /** The 40s escape hatch: keep the words, skip the read. */
  onSaveInstead: () => void;
}

/**
 * ONE SIDE working state — buffered, not streamed (a stream would leak the
 * no-bridge verdict mid-sentence). Staged eyebrows narrate real work at
 * honest wall-clock marks; the response resolves the moment it arrives (the
 * old 4.2s minimum display is deliberately gone). The raw entry was written
 * to the draft store BEFORE this screen mounted, so nothing here can lose it.
 */
export function WorkingStep({
  userText,
  pastedChat,
  onDone,
  onError,
  onCancel,
  onSaveInstead,
}: WorkingStepProps) {
  const [stage, setStage] = useState(0);
  const [considered, setConsidered] = useState(false);
  const [hatch, setHatch] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const t1 = setTimeout(() => setStage(1), 8000);
    const t2 = setTimeout(() => {
      setStage(2);
      setConsidered(true);
    }, 15000);
    const t3 = setTimeout(() => setHatch(true), 40000);

    analyzeV2(userText, pastedChat ?? undefined).then((outcome) => {
      if (!mounted.current) return;
      if (outcome) onDone(outcome);
      else onError();
    });

    return () => {
      mounted.current = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quote = userText.trim().replace(/\s+/g, ' ');
  const shortQuote =
    quote.length > 110 ? `${quote.slice(0, 109).trimEnd()}…` : quote;

  return (
    <View style={{ flex: 1, paddingHorizontal: 30 }}>
      <TopBar title="reading it once" onBack={onCancel} />
      <Text
        style={{
          marginTop: 96,
          fontSize: 17,
          lineHeight: 17 * 1.45,
          color: colors.inkMute,
          fontFamily: fontFamily.ui,
        }}
        numberOfLines={2}
      >
        {shortQuote ? `“${shortQuote}”` : ''}
      </Text>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <PulseDot delay={0} />
        <Text
          testID="working-stage"
          allowFontScaling={false}
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: colors.inkSoft,
          }}
        >
          {WORKING_STAGES[stage]}
        </Text>
        {considered && (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 15 * 1.4,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
            }}
          >
            {WORKING_CONSIDERED}
          </Text>
        )}
        {hatch && (
          <View style={{ flexDirection: 'row', gap: 26, marginTop: 4 }}>
            <Press onPress={() => setHatch(false)} scale={false}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  paddingVertical: 12,
                }}
              >
                Keep waiting
              </Text>
            </Press>
            <Press onPress={onSaveInstead} scale={false}>
              <Text
                testID="working-save-instead"
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: colors.inkSoft,
                  fontFamily: fontFamily.ui,
                  paddingVertical: 12,
                }}
              >
                Save what you wrote
              </Text>
            </Press>
          </View>
        )}
      </View>
    </View>
  );
}
