import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, ICONS } from '../../../components/Icon';
import Btn from '../../../components/Btn';
import TopBar from '../../../components/TopBar';
import { colors, shadows, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import {
  RefocusMode,
  SLOT_LABELS,
  SLOT_OPTIONS,
  SLOT_PLACEHOLDERS,
} from '../../../content/refocus';
import Press from '../../../components/Press';
import Sheet from '../../../components/Sheet';
import {
  composeScaffold,
  scaffoldReady,
  SlotKey,
  SlotValues,
} from '../../../domain/scaffold';
import { useIdentity } from '../../profile/useIdentity';

export interface ShareStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  mode: RefocusMode;
  text: string;
  setText: (text: string) => void;
  /** Receives the composed account (scaffold sentence plus whatever was typed). */
  onSubmit: (composed: string) => void;
  onBack: () => void;
}

export function ShareStep({
  insets,
  mode,
  text,
  setText,
  onSubmit,
  onBack,
}: ShareStepProps) {
  const { partner } = useIdentity();
  const [slots, setSlots] = useState<SlotValues>({});
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);

  const title = mode === 'paste' ? 'paste the convo' : 'your side';
  const ready = scaffoldReady(slots, text);

  const chooseSlot = (key: SlotKey, value: string) => {
    setSlots((s) => ({ ...s, [key]: value }));
    setOpenSlot(null);
  };

  const Slot = ({ k }: { k: SlotKey }) => (
    <Press onPress={() => setOpenSlot(k)} scale={false}>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1.5,
          borderStyle: slots[k] ? 'solid' : 'dashed',
          borderColor: slots[k] ? 'transparent' : 'rgba(157,149,245,0.45)',
          backgroundColor: slots[k] ? colors.usSoft : 'transparent',
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 14.5,
            lineHeight: 14.5 * 1.35,
            fontWeight: '600',
            color: colors.p2Deep,
            fontFamily: fontFamily.ui,
          }}
        >
          {slots[k] ?? SLOT_PLACEHOLDERS[k]}
        </Text>
      </View>
    </Press>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title={title} onBack={onBack} />

      {/* The input is multiline, so Return inserts a newline and never submits.
          Without this the keyboard covered the only way out of the screen. */}
      <KeyboardAvoidingView
        testID="share-keyboard-avoider"
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={{ flex: 1, paddingTop: 100 }}>
        {/* Privacy notice */}
        <View
          style={{
            marginHorizontal: space.gutter,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
          }}
        >
          <Icon d={ICONS.lock} size={15} color={colors.p2Deep} />
          <Text
            style={{
              fontSize: 12.5,
              color: colors.p2Deep,
              fontWeight: '600',
              flex: 1,
              lineHeight: 12.5 * 1.35,
              fontFamily: fontFamily.ui,
            }}
          >
            {`Private to the AI. Nothing is sent to ${partner.name}.`}
          </Text>
        </View>

        {/* Scaffold: four taps are a complete account on their own. */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: space.gutter,
            marginBottom: 8,
          }}
        >
          {(['they', 'i', 'then', 'hear'] as SlotKey[]).map((k) => (
            <React.Fragment key={k}>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  lineHeight: 15 * 1.4,
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                }}
              >
                {SLOT_LABELS[k]}
              </Text>
              <Slot k={k} />
            </React.Fragment>
          ))}
        </View>

        {/* Text input view */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: space.gutter,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus={mode === 'text'}
            placeholder={
              mode === 'paste'
                ? 'Paste the messages here…'
                : 'What happened, from your side? Say it how you actually feel, messy is fine.'
            }
            placeholderTextColor={colors.inkSoft}
            multiline
            style={{
              flex: 1,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 15,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.55,
              fontFamily:
                mode === 'paste' ? fontFamily.mono : fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
        </View>
      </View>

      {/* Sticky button — in flow so the KeyboardAvoidingView lifts it clear of
          the keyboard instead of leaving it underneath. */}
      <View
        style={{
          paddingHorizontal: space.gutter,
          paddingTop: 12,
          paddingBottom: 22,
        }}
      >
        <Btn
          kind="us"
          onPress={() => onSubmit(composeScaffold(slots, text))}
          disabled={!ready}
          sub="private, just for you"
        >
          Untangle it
        </Btn>
      </View>
      </KeyboardAvoidingView>
      {openSlot ? (
        <Sheet title={`${SLOT_LABELS[openSlot]}…`} onClose={() => setOpenSlot(null)}>
          {SLOT_OPTIONS[openSlot].map((opt) => (
            <Press key={opt} onPress={() => chooseSlot(openSlot, opt)} scale={false}>
              <View style={{ paddingVertical: 12 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 15.5,
                    lineHeight: 15.5 * 1.4,
                    fontWeight: '500',
                    color: slots[openSlot] === opt ? colors.p2Deep : colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {opt}
                </Text>
              </View>
            </Press>
          ))}
        </Sheet>
      ) : null}
    </SafeAreaView>
  );
}
