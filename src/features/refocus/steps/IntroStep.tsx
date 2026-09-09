import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../../components/Press';
import Btn from '../../../components/Btn';
import { Kick, Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { colors, radius, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import type { RefocusSession } from '../../../types/db';

export interface IntroStepProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  canTogether: boolean;
  openSession: RefocusSession | null;
  myId: string | null;
  onStartTogether: () => void;
  onStartSolo: () => void;
  onBack: () => void;
}

/**
 * v7 entry: one question about a fight that already happened. The old screen
 * explained the product before letting anyone use it; this one opens on the
 * thing the user came for, and pairing stops being the entry fee.
 */
export function IntroStep({
  insets,
  canTogether,
  openSession,
  myId,
  onStartTogether,
  onStartSolo,
  onBack,
}: IntroStepProps) {
  const invited =
    !!openSession &&
    openSession.state === 'waiting_partner' &&
    openSession.initiator !== myId;
  const open = !!openSession && openSession.state !== 'expired';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 96,
          paddingBottom: canTogether ? 200 : 150,
        }}
      >
        <Kick>parallax</Kick>

        <Serif
          s={38}
          style={{
            marginTop: 70,
            lineHeight: 38 * 1.04,
            letterSpacing: -0.012 * 38,
          }}
        >
          Think of the last argument you had.
        </Serif>

        <Text
          allowFontScaling={false}
          style={{
            fontSize: 15,
            lineHeight: 15 * 1.5,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
            marginTop: 14,
          }}
        >
          Not the worst one. The last one. A few minutes, and nothing you write
          goes anywhere unless you copy it out yourself.
        </Text>

        {open && openSession ? (
          <Press onPress={onStartTogether} scale={false}>
            <View
              style={{
                marginTop: 26,
                paddingVertical: 15,
                paddingHorizontal: 17,
                borderRadius: radius.card,
                backgroundColor: colors.usSoft,
                borderWidth: 1,
                borderColor: 'rgba(157,149,245,0.25)',
              }}
            >
              <Kick c={colors.p2Deep}>
                {invited ? 'they started one' : 'in progress'}
              </Kick>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  lineHeight: 15 * 1.45,
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                  marginTop: 6,
                }}
              >
                {invited
                  ? `“${openSession.topic}” — add your side`
                  : `“${openSession.topic}” — tap to check on it`}
              </Text>
            </View>
          </Press>
        ) : null}
      </ScrollView>

      {/* Sticky actions: solo is the primary way in; together is one tap away. */}
      <View
        style={{
          position: 'absolute',
          bottom: 22 + insets.bottom,
          left: space.gutter,
          right: space.gutter,
          zIndex: 40,
          gap: 10,
        }}
      >
        <Btn
          kind="us"
          onPress={onStartSolo}
          sub="just your side, privately"
          testID="refocus-start"
        >
          Start there
        </Btn>
        {canTogether && (
          <Btn
            kind="soft"
            onPress={onStartTogether}
            sub="both real sides, one middle ground"
            testID="refocus-start-together"
          >
            Untangle it together
          </Btn>
        )}
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 9.5,
            letterSpacing: 0.14 * 9.5,
            textTransform: 'uppercase',
            color: colors.inkMute,
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          private to you · nothing is sent
        </Text>
      </View>
    </SafeAreaView>
  );
}
