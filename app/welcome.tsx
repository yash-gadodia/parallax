import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import { Serif } from '../src/components/Text';
import { colors, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';

// ONE SIDE first run — the entire onboarding. No carousel, no tour, no
// pairing: this app is for one person and says so. It exists because the
// launch screen is a bare question, and a stranger deserves one screen that
// says what the question is for before they answer it.
export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: space.gutter,
          justifyContent: 'center',
        }}
      >
        <Serif s={22} c={colors.inkSoft} style={{ marginBottom: 24 }}>
          Parallax
        </Serif>

        <Serif s={36} style={{ lineHeight: 36 * 1.12, letterSpacing: -0.43 }}>
          One side of the story. Yours.
        </Serif>

        <Text
          style={{
            fontSize: 16,
            lineHeight: 16 * 1.5,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
            marginTop: 14,
            maxWidth: 330,
          }}
        >
          For the ten minutes after a fight, when you are rereading the chat and
          you do not know what to send.
        </Text>

        <View style={{ marginTop: 30, gap: 14 }}>
          {[
            'Say what happened, or paste the argument.',
            'Get back what is underneath it for you, and the thing they are probably not wrong about.',
            'And one sentence worth sending, or an honest nothing to send.',
          ].map((line, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 11,
                  color: colors.inkMute,
                  marginTop: 4,
                }}
              >
                {`0${i + 1}`}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15.5,
                  lineHeight: 15.5 * 1.45,
                  color: colors.ink,
                  fontFamily: fontFamily.ui,
                }}
              >
                {line}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            fontSize: 13,
            lineHeight: 13 * 1.5,
            color: colors.inkSoft,
            fontFamily: fontFamily.ui,
            marginTop: 26,
            maxWidth: 330,
          }}
        >
          Your partner never gets an account, a link, or a screen. Nothing
          leaves this app unless you copy it out yourself.
        </Text>
      </View>

      <View style={{ paddingHorizontal: space.gutter, paddingBottom: 18, gap: 4 }}>
        <Btn kind="ink" testID="welcome-start" onPress={() => router.push('/signup')}>
          Start
        </Btn>
        <Press onPress={() => router.push('/login')} scale={false}>
          <Text
            testID="welcome-signin"
            allowFontScaling={false}
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              textAlign: 'center',
              paddingVertical: 14,
            }}
          >
            I already have an account
          </Text>
        </Press>
      </View>
    </SafeAreaView>
  );
}
