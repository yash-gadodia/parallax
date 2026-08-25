import React from 'react';
import { View, Text } from 'react-native';
import { Peek } from '../../../components/Peek';
import { Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, radius } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { useIdentity } from '../../profile/useIdentity';
import { SideInRow } from './shared';

export function TogetherWaitingStep({
  topic,
  onBack,
}: {
  topic: string;
  onBack: () => void;
}) {
  const { partner } = useIdentity();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 34,
      }}
    >
      <TopBar title="untangling together" onBack={onBack} />

      <View
        style={{
          width: 150,
          height: 120,
          marginBottom: 28,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Float distance={7} duration={3500}>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: radius.pill,
              backgroundColor: colors.usSoft,
            }}
          />
        </Float>
        <Float distance={7} duration={4000}>
          <Peek size={128} mood="search" />
        </Float>
      </View>

      <Serif
        s={28}
        italic
        style={{
          textAlign: 'center',
          marginBottom: 10,
          maxWidth: 290,
          lineHeight: 28 * 1.09,
        }}
      >
        {`waiting for ${partner.name}…`}
      </Serif>
      <Text
        style={{
          fontSize: 13.5,
          color: colors.inkSoft,
          textAlign: 'center',
          maxWidth: 290,
          lineHeight: 13.5 * 1.5,
          fontFamily: fontFamily.ui,
          marginBottom: 24,
        }}
      >
        {`We let them know about "${topic}". The moment their side is in, the middle ground appears here for both of you.`}
      </Text>

      <View style={{ width: '100%', maxWidth: 280, gap: 12 }}>
        <SideInRow label="Your side is in" you />
      </View>
    </View>
  );
}
