import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Btn from '../../../components/Btn';
import TopBar from '../../../components/TopBar';
import { colors, shadows, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { useIdentity } from '../../profile/useIdentity';
import type { RefocusSession } from '../../../types/db';

export function TogetherAddStep({
  session,
  onBack,
  onSubmit,
}: {
  session: RefocusSession;
  onBack: () => void;
  onSubmit: (side: string) => Promise<void>;
}) {
  const { partner } = useIdentity();
  const [side, setSide] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = side.trim().length > 3 && !busy;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="add your side" onBack={onBack} />
      <View style={{ flex: 1, paddingTop: 100, paddingBottom: 96 }}>
        <View
          style={{
            marginHorizontal: space.gutter,
            marginBottom: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.usSoft,
            borderWidth: 1,
            borderColor: 'rgba(157,149,245,0.22)',
          }}
        >
          <Text
            style={{
              fontSize: 13.5,
              color: colors.p2Deep,
              fontWeight: '700',
              lineHeight: 13.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`${partner.name} wants to refocus: ${session.topic}`}
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              color: colors.p2Deep,
              marginTop: 3,
              lineHeight: 12.5 * 1.4,
              fontFamily: fontFamily.ui,
            }}
          >
            {`They can't read your raw words, only the middle ground you'll both see.`}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: space.gutter }}>
          <TextInput
            value={side}
            onChangeText={setSide}
            autoFocus
            placeholder="Your side of it, honestly. Messy is fine."
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
              fontFamily: fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 22,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
        }}
      >
        <Btn
          kind="us"
          onPress={async () => {
            setBusy(true);
            try {
              await onSubmit(side.trim());
            } finally {
              setBusy(false);
            }
          }}
          disabled={!ready}
          sub="then we find the middle, together"
          testID="refocus-add-side"
        >
          Add my side
        </Btn>
      </View>
    </SafeAreaView>
  );
}
