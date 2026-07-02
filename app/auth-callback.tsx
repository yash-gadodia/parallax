import { useEffect, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import Toast from '../src/components/Toast';
import { useUiStore } from '../src/store/ui';

import {
  verifyEmailOtp,
  resendConfirmationEmail,
  isValidEmail,
} from '../src/features/auth/authActions';

export default function AuthCallback() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const isRecovery = type === 'recovery';
  const { toast, fireToast } = useUiStore();
  const [state, setState] = useState<'verifying' | 'done' | 'error'>('verifying');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (typeof token_hash !== 'string' || !token_hash) {
        setState('error');
        return;
      }
      try {
        await verifyEmailOtp(token_hash, isRecovery ? 'recovery' : 'signup');
        setState('done');
      } catch {
        setState('error');
      }
    };
    run();
  }, [token_hash, isRecovery]);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  const handleResend = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setResendWait(30);
    try {
      await resendConfirmationEmail(email.trim());
      fireToast('Confirmation email re-sent');
    } catch (err) {
      fireToast(err instanceof Error ? err.message : 'Could not resend the email');
    }
  };

  if (state === 'done') {
    return <Redirect href={isRecovery ? '/resetPassword' : '/'} />;
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
            {isRecovery ? 'Opening your reset link…' : 'Confirming your email…'}
          </Text>
        </>
      ) : (
        <View style={{ alignItems: 'center', maxWidth: 320, width: '100%' }}>
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
              marginBottom: 24,
            }}
          >
            {isRecovery
              ? 'Reset links are single-use and time out. Request a new one from the sign-in screen.'
              : 'Confirmation links are single-use and time out. Enter your email and we’ll send a fresh one.'}
          </Text>

          {!isRecovery && (
            <>
              <View
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  paddingHorizontal: 15,
                  borderRadius: radius.input,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  ...shadows.shadowSoft,
                }}
              >
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.inkMute}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  allowFontScaling={false}
                  style={{
                    fontSize: 15.5,
                    fontWeight: '600',
                    fontFamily: fontFamily.ui,
                    color: colors.ink,
                    lineHeight: 24,
                  }}
                />
              </View>
              {emailError && (
                <Text
                  allowFontScaling={false}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 6,
                    fontSize: 12.5,
                    lineHeight: 17,
                    color: colors.p1Deep,
                    fontFamily: fontFamily.ui,
                  }}
                >
                  {emailError}
                </Text>
              )}
              <View style={{ width: '100%', marginTop: 16 }}>
                <Btn kind="us" onPress={handleResend} disabled={resendWait > 0}>
                  {resendWait > 0 ? `Resend in ${resendWait}s` : 'Resend confirmation email'}
                </Btn>
              </View>
            </>
          )}

          <Press scale={false} onPress={() => router.replace('/login')}>
            <Text
              allowFontScaling={false}
              style={{
                textAlign: 'center',
                padding: 14,
                marginTop: 8,
                fontSize: 14,
                fontWeight: '600',
                color: colors.inkMute,
                fontFamily: fontFamily.ui,
                lineHeight: 20,
              }}
            >
              Go to sign in
            </Text>
          </Press>
        </View>
      )}
      {toast && <Toast msg={toast} />}
    </LinearGradient>
  );
}
