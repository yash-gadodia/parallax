import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';
import Press from '../src/components/Press';
import { Wordmark } from '../src/components/Wordmark';
import { Icon, ICONS } from '../src/components/Icon';
import { Peek } from '../src/components/Peek';
import { Float } from '../src/components/Float';
import TopBar from '../src/components/TopBar';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Toast from '../src/components/Toast';
import { useUiStore } from '../src/store/ui';
import {
  signUpWithEmail,
  signInWithApple,
  signInWithGoogle,
  resendConfirmationEmail,
  isValidEmail,
  humanAuthError,
} from '../src/features/auth/authActions';
import { track, EVENTS } from '../src/lib/analytics';

const labelStyle = {
  fontFamily: fontFamily.mono,
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: 'uppercase' as const,
  color: colors.inkMute,
  marginBottom: 8,
  lineHeight: 10,
};

const fieldWrap = {
  paddingVertical: 14,
  paddingHorizontal: 15,
  borderRadius: radius.input,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  ...shadows.shadowSoft,
};

const inputStyle = {
  fontSize: 15.5,
  fontWeight: '600' as const,
  fontFamily: fontFamily.ui,
  color: colors.ink,
  lineHeight: 24,
};

export default function SignupScreen() {
  const router = useRouter();
  const { toast, fireToast } = useUiStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    track(EVENTS.SIGNUP_STARTED);
  }, []);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  const handleSignUp = async () => {
    if (!name.trim()) {
      fireToast('What should we call you?');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      fireToast('Password needs at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      track(EVENTS.SIGNUP_COMPLETED);
      setSent(true);
    } catch (err) {
      fireToast(humanAuthError(err, "couldn't create your account — try again in a sec"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendWait(30);
    try {
      await resendConfirmationEmail(email.trim());
      fireToast('Confirmation email re-sent');
    } catch (err) {
      fireToast(humanAuthError(err, "couldn't resend the email — try again in a sec"));
    }
  };

  const handleSocial = async (
    provider: 'apple' | 'google',
    fn: () => Promise<void>
  ) => {
    setLoading(true);
    try {
      await fn();
      router.replace('/');
    } catch (err) {
      const fallback =
        provider === 'apple'
          ? "Apple sign-in didn't finish — try again in a sec"
          : "Google sign-in didn't finish — try again in a sec";
      fireToast(humanAuthError(err, fallback));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <LinearGradient
        colors={gradients.dawn.colors}
        locations={gradients.dawn.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <DawnBlobs />

      <TopBar title="" onBack={() => router.replace('/(onboarding)')} />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 40 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: 72 }} />

          {sent ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Float>
                <Peek size={120} mood="love" />
              </Float>
              <Serif s={32} style={{ marginTop: 24, textAlign: 'center' }}>
                Check your inbox
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15.5,
                  color: colors.inkSoft,
                  lineHeight: 24,
                  marginTop: 12,
                  maxWidth: 320,
                  textAlign: 'center',
                  fontFamily: fontFamily.ui,
                }}
              >
                We sent a confirmation link to{' '}
                <Text style={{ fontWeight: '700', color: colors.ink }}>{email.trim()}</Text>. Tap it
                to finish setting up and meet your person.
              </Text>
              <Press scale={false} onPress={handleResend} disabled={resendWait > 0}>
                <Text
                  allowFontScaling={false}
                  style={{
                    textAlign: 'center',
                    padding: 16,
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: '700',
                    color: resendWait > 0 ? colors.inkMute : colors.p2Deep,
                    fontFamily: fontFamily.ui,
                    lineHeight: 20,
                  }}
                >
                  {resendWait > 0 ? `Resend in ${resendWait}s` : "Didn't get it? Resend email"}
                </Text>
              </Press>
              <Press scale={false} onPress={() => router.replace('/login')}>
                <Text
                  allowFontScaling={false}
                  style={{
                    textAlign: 'center',
                    padding: 16,
                    marginTop: 16,
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.inkMute,
                    fontFamily: fontFamily.ui,
                    lineHeight: 20,
                  }}
                >
                  Already confirmed? Sign in
                </Text>
              </Press>
            </View>
          ) : (
            <>
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <Wordmark size={44} />
              </View>

              <Kick style={{ marginBottom: 8 }}>nice to meet you</Kick>
              <Serif s={32} style={{ marginBottom: 26 }}>
                Create your account
              </Serif>

              <View style={{ marginBottom: 16 }}>
                <Text allowFontScaling={false} style={labelStyle}>
                  Your name
                </Text>
                <View style={fieldWrap}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Yash"
                    placeholderTextColor={colors.inkMute}
                    autoCapitalize="words"
                    editable={!loading}
                    allowFontScaling={false}
                    style={inputStyle}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text allowFontScaling={false} style={labelStyle}>
                  Email
                </Text>
                <View style={fieldWrap}>
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
                    editable={!loading}
                    allowFontScaling={false}
                    style={inputStyle}
                  />
                </View>
                {emailError && (
                  <Text
                    allowFontScaling={false}
                    style={{
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
              </View>

              <View style={{ marginBottom: 28 }}>
                <Text allowFontScaling={false} style={labelStyle}>
                  Password
                </Text>
                <View style={fieldWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="at least 6 characters"
                    placeholderTextColor={colors.inkMute}
                    secureTextEntry
                    editable={!loading}
                    allowFontScaling={false}
                    style={inputStyle}
                  />
                </View>
              </View>

              <Btn kind="us" onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Create account'}
              </Btn>

              {/* OR divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: colors.inkMute,
                  }}
                >
                  or
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
              </View>

              {/* Continue with Apple (iOS) */}
              {Platform.OS === 'ios' && (
                <Press
                  onPress={() => handleSocial('apple', signInWithApple)}
                  disabled={loading}
                  style={{ marginBottom: 10 }}
                >
                  <View
                    style={{
                      minHeight: 54,
                      borderRadius: radius.pill,
                      backgroundColor: colors.ink,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 9,
                      ...shadows.shadowSoft,
                    }}
                  >
                    <Icon d={ICONS.apple} size={18} color="#fff" fill="#fff" sw={0} />
                    <Text
                      allowFontScaling={false}
                      style={{ fontSize: 15.5, fontWeight: '700', color: '#fff', fontFamily: fontFamily.ui }}
                    >
                      Continue with Apple
                    </Text>
                  </View>
                </Press>
              )}

              {/* Continue with Google */}
              <Press
                onPress={() => handleSocial('google', signInWithGoogle)}
                disabled={loading}
                style={{ marginBottom: 12 }}
              >
                <View
                  style={{
                    minHeight: 54,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.line,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                    ...shadows.shadowSoft,
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: 16, fontWeight: '800', color: '#4285F4', fontFamily: fontFamily.ui }}
                  >
                    G
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink, fontFamily: fontFamily.ui }}
                  >
                    Continue with Google
                  </Text>
                </View>
              </Press>

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
                  Already have an account? Sign in
                </Text>
              </Press>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {toast && <Toast msg={toast} />}
    </View>
  );
}
