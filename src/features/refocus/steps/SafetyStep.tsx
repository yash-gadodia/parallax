import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Peek } from '../../../components/Peek';
import Card from '../../../components/Card';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import {
  RefocusSafety,
  AI_DISCLOSURE,
  THERAPY_DISCLAIMER,
} from '../../../content/refocus';

export function SafetyStep({
  safety,
  onBack,
}: {
  safety: RefocusSafety;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 90,
          paddingBottom: 60,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Float distance={7} duration={4000}>
            <Peek size={96} mood="focus" />
          </Float>
        </View>
        <Serif
          s={30}
          style={{
            textAlign: 'center',
            marginBottom: 14,
            lineHeight: 30 * 1.09,
          }}
        >
          {safety.title}
        </Serif>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 15 * 1.55,
            color: colors.ink,
            textAlign: 'center',
            fontFamily: fontFamily.ui,
            marginBottom: 24,
          }}
        >
          {safety.message}
        </Text>

        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 8,
          }}
        >
          {safety.helplines.map((h, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingVertical: 13,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: i > 0 ? colors.line : 'transparent',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  color: colors.ink,
                  fontWeight: '600',
                  lineHeight: 13.5 * 1.35,
                  fontFamily: fontFamily.ui,
                }}
              >
                {h.name}
              </Text>
              <Text
                style={{
                  fontSize: 14.5,
                  color: colors.p2Deep,
                  fontWeight: '700',
                  fontFamily: fontFamily.ui,
                }}
              >
                {h.contact}
              </Text>
            </View>
          ))}
        </Card>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: colors.inkMute,
            marginTop: 24,
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
