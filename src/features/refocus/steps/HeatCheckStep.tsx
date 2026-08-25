import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../../components/Press';
import Card from '../../../components/Card';
import Chip from '../../../components/Chip';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { HEAT_LEVELS, TOPIC_TAGS, HeatLevel } from '../../../content/refocus';

export interface HeatCheckStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  onSelect: (heat: HeatLevel, topic: string | null) => void;
  onBack: () => void;
}

export function HeatCheckStep({ onSelect, onBack }: HeatCheckStepProps) {
  const [topic, setTopic] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="where are you at" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: 40,
        }}
      >
        <Serif s={32} style={{ marginBottom: 6, lineHeight: 32 * 1.08 }}>
          How hot is it right now?
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            color: colors.inkSoft,
            marginBottom: 22,
            lineHeight: 14.5 * 1.5,
            fontFamily: fontFamily.ui,
          }}
        >
          Your best guess is fine. Nobody sees this but you.
        </Text>

        <View style={{ gap: 12 }}>
          {HEAT_LEVELS.map((h) => (
            <Press key={h.id} onPress={() => onSelect(h.id, topic)}>
              <Card
                style={{
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 15,
                }}
              >
                <Text style={{ fontSize: 30 }}>{h.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {h.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.inkSoft,
                      marginTop: 2,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {h.desc}
                  </Text>
                </View>
              </Card>
            </Press>
          ))}
        </View>

        <Text
          style={{
            fontSize: 13,
            color: colors.inkMute,
            marginTop: 28,
            marginBottom: 10,
            fontFamily: fontFamily.ui,
          }}
        >
          What's it about? (optional)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TOPIC_TAGS.map((t) => (
            <Press key={t} onPress={() => setTopic(topic === t ? null : t)}>
              <Chip soft={topic !== t} selected={topic === t}>
                {t}
              </Chip>
            </Press>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
