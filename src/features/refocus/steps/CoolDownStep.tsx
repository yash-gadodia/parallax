import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../../components/Press';
import Btn from '../../../components/Btn';
import { Peek } from '../../../components/Peek';
import { Float } from '../../../components/Float';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { COOL_DOWN } from '../../../content/refocus';

export interface CoolDownStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  onReady: () => void;
  onLater: () => void;
  onBack: () => void;
}

export function CoolDownStep({ onReady, onLater, onBack }: CoolDownStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 90,
          paddingBottom: 40,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Float>
            <Peek size={96} mood="search" />
          </Float>
        </View>

        <Serif s={32} style={{ marginBottom: 14, lineHeight: 32 * 1.08 }}>
          {COOL_DOWN.title}
        </Serif>

        <Text
          style={{
            fontSize: 15,
            color: colors.inkSoft,
            lineHeight: 15 * 1.55,
            marginBottom: 16,
            fontFamily: fontFamily.ui,
          }}
        >
          {COOL_DOWN.body}
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colors.ink,
            lineHeight: 15 * 1.55,
            marginBottom: 32,
            fontFamily: fontFamily.ui,
          }}
        >
          {COOL_DOWN.ask}
        </Text>

        <Btn kind="us" onPress={onReady}>
          {COOL_DOWN.primary}
        </Btn>

        <Press scale={false} onPress={onLater}>
          <Text
            style={{
              textAlign: 'center',
              padding: 12,
              fontSize: 14,
              fontWeight: '600',
              color: colors.inkMute,
              fontFamily: fontFamily.ui,
            }}
          >
            {COOL_DOWN.secondary}
          </Text>
        </Press>
      </ScrollView>
    </SafeAreaView>
  );
}
