import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../../components/Press';
import { Icon, ICONS } from '../../../components/Icon';
import Card from '../../../components/Card';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { MODES, RefocusMode } from '../../../content/refocus';

export interface ModeStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  onSelectMode: (mode: RefocusMode) => void;
  onBack: () => void;
}

export function ModeStep({ insets, onSelectMode, onBack }: ModeStepProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="how to share" onBack={onBack} />
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
          How do you want to get it out?
        </Serif>
        <Text
          style={{
            fontSize: 14.5,
            color: colors.inkSoft,
            marginBottom: 22,
            fontFamily: fontFamily.ui,
          }}
        >
          However it comes easiest. Only the AI reads this.
        </Text>

        <View style={{ gap: 12 }}>
          {MODES.map((m) => (
            <Press key={m.id} onPress={() => onSelectMode(m.id)}>
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
                <Text style={{ fontSize: 30 }}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '700',
                      color: colors.ink,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.inkSoft,
                      marginTop: 2,
                      fontFamily: fontFamily.ui,
                    }}
                  >
                    {m.desc}
                  </Text>
                </View>
                <Icon
                  d={ICONS.chevR}
                  size={18}
                  color={colors.inkMute}
                />
              </Card>
            </Press>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
