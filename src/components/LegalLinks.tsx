import React from 'react';
import { View, Text, Linking } from 'react-native';
import Press from './Press';
import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';
import { LEGAL } from '../lib/links';

// Apple guideline 3.1.2(c): auto-renewable subscription flows must carry
// functional links to the Terms of Use (EULA) and Privacy Policy.
export default function LegalLinks({ style }: { style?: object }) {
  const link = {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.inkSoft,
    fontFamily: fontFamily.ui,
    textDecorationLine: 'underline' as const,
  };
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
        style,
      ]}
    >
      <Press onPress={() => Linking.openURL(LEGAL.terms)} scale={false}>
        <Text allowFontScaling={false} style={link}>
          Terms of Use
        </Text>
      </Press>
      <Text allowFontScaling={false} style={{ fontSize: 12, color: colors.inkMute, fontFamily: fontFamily.ui }}>
        ·
      </Text>
      <Press onPress={() => Linking.openURL(LEGAL.privacy)} scale={false}>
        <Text allowFontScaling={false} style={link}>
          Privacy Policy
        </Text>
      </Press>
    </View>
  );
}
