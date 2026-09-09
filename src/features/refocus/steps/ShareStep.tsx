import React from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, ICONS } from '../../../components/Icon';
import Btn from '../../../components/Btn';
import TopBar from '../../../components/TopBar';
import { colors, shadows, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { RefocusMode } from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';

export interface ShareStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  mode: RefocusMode;
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
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

  const title = mode === 'paste' ? 'paste the convo' : 'your side';
  const ready = text.trim().length > 3;

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
          onPress={onSubmit}
          disabled={!ready}
          sub="private, just for you"
        >
          Untangle it
        </Btn>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
