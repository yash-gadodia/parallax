import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';

import { verifyEmailOtp } from '../src/features/auth/authActions';

export default function AuthCallback() {
  const router = useRouter();
  const { token_hash } = useLocalSearchParams<{ token_hash?: string }>();
  const [state, setState] = useState<'verifying' | 'done' | 'error'>('verifying');

  useEffect(() => {
    const run = async () => {
      if (typeof token_hash !== 'string' || !token_hash) {
        setState('error');
        return;
      }
      try {
        await verifyEmailOtp(token_hash);
        setState('done');
      } catch {
        setState('error');
      }
    };
    run();
  }, [token_hash]);

  if (state === 'done') {
    return <Redirect href="/" />;
  }

  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.gutter }}
    >
      {state === 'verifying' ? (
        <>
          <ActivityIndicator color={colors.ink} />
          <Text
            allowFontScaling={false}
            style={{
              marginTop: 16,
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            Confirming your email…
          </Text>
        </>
      ) : (
        <View style={{ alignItems: 'center', maxWidth: 320 }}>
          <Serif s={26} style={{ textAlign: 'center', marginBottom: 10 }}>
            This link has expired
          </Serif>
          <Text
            allowFontScaling={false}
            style={{
              color: colors.inkSoft,
              fontFamily: fontFamily.ui,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            Confirmation links are single-use and time out. Sign in to send a fresh one.
          </Text>
          <Btn kind="us" onPress={() => router.replace('/login')}>
            Go to sign in
          </Btn>
        </View>
      )}
    </LinearGradient>
  );
}
