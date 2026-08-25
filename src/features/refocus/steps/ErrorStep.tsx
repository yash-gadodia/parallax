import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Peek } from '../../../components/Peek';
import Btn from '../../../components/Btn';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';

export interface ErrorStepProps {
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorStep({ onRetry, onBack }: ErrorStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 34,
        }}
      >
        <Float distance={7} duration={4000}>
          <Peek size={104} mood="search" />
        </Float>
        <Serif
          s={28}
          italic
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 12,
            maxWidth: 280,
            lineHeight: 28 * 1.09,
          }}
        >
          Still a little blurry.
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 14.5 * 1.55,
            color: colors.inkSoft,
            textAlign: 'center',
            maxWidth: 290,
            fontFamily: fontFamily.ui,
            marginBottom: 28,
          }}
        >
          We couldn&apos;t reach the AI just now. Your words are safe right
          here, give it another go in a moment.
        </Text>
        <View style={{ width: '100%', maxWidth: 300, gap: 10 }}>
          <Btn kind="us" onPress={onRetry} testID="refocus-retry">
            Try again
          </Btn>
          <Btn kind="soft" onPress={onBack}>
            Back to my words
          </Btn>
        </View>
      </View>
    </SafeAreaView>
  );
}
