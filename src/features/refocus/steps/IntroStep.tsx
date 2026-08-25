import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Peek } from '../../../components/Peek';
import Press from '../../../components/Press';
import { Icon, ICONS } from '../../../components/Icon';
import Card from '../../../components/Card';
import Btn from '../../../components/Btn';
import { Kick, Serif } from '../../../components/Text';
import TopBar from '../../../components/TopBar';
import { Float } from '../../../components/Float';
import { colors, space } from '../../../design/tokens';
import { fontFamily } from '../../../design/typography';
import { PROMISES } from '../../../content/refocus';
import { useIdentity } from '../../profile/useIdentity';
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

export function IntroStep({
  insets,
  canTogether,
  openSession,
  myId,
  onStartTogether,
  onStartSolo,
  onBack,
}: IntroStepProps) {
  const { partner } = useIdentity();
  const invited =
    !!openSession &&
    openSession.state === 'waiting_partner' &&
    openSession.initiator !== myId;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar title="refocus" onBack={onBack} />
      <ScrollView
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingTop: 70,
          paddingBottom: canTogether ? 230 : 160,
        }}
      >
        {/* Hero: floating Peek */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Float distance={7} duration={4000}>
            <Peek size={104} mood="focus" />
          </Float>
        </View>

        {/* Heading */}
        <View style={{ alignItems: 'center' }}>
          <Kick c={colors.p2Deep}>refocus</Kick>
          <Serif
            s={36}
            style={{
              marginTop: 10,
              marginBottom: 10,
              textAlign: 'center',
              lineHeight: 36 * 1.08,
            }}
          >
            Things feel a little{'\n'}out of focus?
          </Serif>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 15 * 1.55,
              color: colors.inkSoft,
              textAlign: 'center',
              maxWidth: 300,
              fontFamily: fontFamily.ui,
            }}
          >
            A rough moment gets easier once you untangle it. Do it together,
            each of you adds your real side and we find the middle, or just
            untangle your side, privately.
          </Text>
        </View>

        {/* An open session: the way back in (or the partner's invite) */}
        {openSession && (
          <Press onPress={onStartTogether}>
            <Card
              style={{
                borderRadius: 22,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginTop: 22,
                backgroundColor: colors.usSoft,
                borderWidth: 1,
                borderColor: 'rgba(157,149,245,0.25)',
              }}
            >
              <Kick c={colors.p2Deep}>
                {invited ? 'your side is missing' : 'in progress'}
              </Kick>
              <Text
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: colors.ink,
                  marginTop: 6,
                  lineHeight: 14.5 * 1.4,
                  fontFamily: fontFamily.ui,
                }}
              >
                {invited
                  ? `${partner.name} wants to refocus: ${openSession.topic} — add your side`
                  : `"${openSession.topic}" — tap to check on it`}
              </Text>
            </Card>
          </Press>
        )}

        {/* Promises card */}
        <Card
          style={{
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginTop: 24,
          }}
        >
          {PROMISES.map((promise, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingVertical: 14,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: i > 0 ? colors.line : 'transparent',
              }}
            >
              {/* Icon badge */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: colors.usSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  d={ICONS[promise.iconId as keyof typeof ICONS]}
                  size={18}
                  color={colors.p2Deep}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14.5,
                    fontWeight: '700',
                    color: colors.ink,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {promise.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    color: colors.inkSoft,
                    marginTop: 2,
                    lineHeight: 12.5 * 1.4,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {promise.desc}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Sticky buttons */}
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
        {canTogether && (
          <Btn
            kind="us"
            onPress={onStartTogether}
            sub="both real sides, one middle ground"
            testID="refocus-start-together"
          >
            Untangle it together
          </Btn>
        )}
        <Btn
          kind={canTogether ? 'soft' : 'us'}
          onPress={onStartSolo}
          sub="just your side, privately"
          testID="refocus-start"
        >
          Just my side
        </Btn>
      </View>
    </SafeAreaView>
  );
}
