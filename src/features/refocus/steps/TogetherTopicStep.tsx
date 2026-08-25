import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Btn from '../../../components/Btn';
import { Icon, ICONS } from '../../../components/Icon';
import TopBar from '../../../components/TopBar';
import { colors, shadows, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { useIdentity } from '../../profile/useIdentity';

export function TogetherTopicStep({
  onBack,
  onSubmit,
  initialTopic = '',
}: {
  onBack: () => void;
  onSubmit: (topic: string, side: string) => Promise<void>;
  initialTopic?: string;
}) {
  const { partner } = useIdentity();
  const [topic, setTopic] = useState(initialTopic);
  const [side, setSide] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = topic.trim().length > 1 && side.trim().length > 3 && !busy;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="untangle it together" onBack={onBack} />
      <View style={{ flex: 1, paddingTop: 100, paddingBottom: 96 }}>
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
            {`${partner.name} sees the topic and the middle ground, never your raw words.`}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: space.gutter, gap: 10 }}>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            autoFocus
            placeholder="What's it about? (a few words)"
            placeholderTextColor={colors.inkSoft}
            maxLength={120}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingVertical: 14,
              paddingHorizontal: 16,
              fontSize: 15.5,
              lineHeight: 15.5 * 1.4,
              fontFamily: fontFamily.ui,
              color: colors.ink,
              ...shadows.shadowSoft,
            }}
          />
          <TextInput
            value={side}
            onChangeText={setSide}
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
              await onSubmit(topic.trim(), side.trim());
            } finally {
              setBusy(false);
            }
          }}
          disabled={!ready}
          sub={`${partner.name} adds theirs, then we find the middle`}
          testID="refocus-together-submit"
        >
          Send it to the middle
        </Btn>
      </View>
    </SafeAreaView>
  );
}
