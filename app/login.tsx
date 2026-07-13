import React, { useState } from 'react';
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
import TopBar from '../src/components/TopBar';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Toast from '../src/components/Toast';
import { useUiStore } from '../src/store/ui';
import {
  signInWithEmail,
  signInWithApple,
  signInWithGoogle,
  requestPasswordReset,
  isValidEmail,
  humanAuthError,
} from '../src/features/auth/authActions';

export default function LoginScreen() {
  const router = useRouter();
  const { toast, fireToast } = useUiStore();
  // Dev convenience: pre-fill the seeded test account so login is one tap.
  // __DEV__ is false in any release build, so this never ships.
  const [email, setEmail] = useState(__DEV__ ? 'test@parallax.app' : '');
  const [password, setPassword] = useState(__DEV__ ? 'parallax123' : '');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'resetSent'>('login');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleBack = () => {
    if (mode !== 'login') {
      setMode('login');
      setEmailError(null);
      return;
    }
    router.replace('/(onboarding)');
  };

  const handleSendReset = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setMode('resetSent');
    } catch (err) {
      fireToast(humanAuthError(err, "couldn't send the reset link — try again in a sec"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogIn = async () => {
    if (!email.trim()) {
      fireToast("what's your email?");
      return;
    }

    if (!password) {
      fireToast("don't forget your password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/');
    } catch (err) {
      fireToast(humanAuthError(err, "couldn't sign you in — try again in a sec"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    router.replace('/(onboarding)');
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

      <TopBar title="" onBack={handleBack} />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.gutter,
            paddingBottom: 40,
          }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top spacing */}
          <View style={{ height: 72 }} />

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Wordmark size={48} />
          </View>

          {mode === 'forgot' ? (
            <>
              <Kick style={{ marginBottom: 8 }}>reset password</Kick>
              <Serif s={34} style={{ marginBottom: 12 }}>
                Forgot your password?
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  color: colors.inkSoft,
                  lineHeight: 23,
                  marginBottom: 24,
                  fontFamily: fontFamily.ui,
                }}
              >
                Enter your email and we'll send you a link to set a new one.
              </Text>

              <View style={{ marginBottom: 24 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: colors.inkMute,
                    marginBottom: 8,
                    lineHeight: 10,
                  }}
                >
                  Email
                </Text>
                <View
                  style={{
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
                    editable={!loading}
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

              <Btn kind="us" onPress={handleSendReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Send reset link'}
              </Btn>

              <Press scale={false} onPress={() => setMode('login')}>
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
                  Back to log in
                </Text>
              </Press>
            </>
          ) : mode === 'resetSent' ? (
            <>
              <Kick style={{ marginBottom: 8 }}>reset password</Kick>
              <Serif s={34} style={{ marginBottom: 12 }}>
                Check your inbox
              </Serif>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 15,
                  color: colors.inkSoft,
                  lineHeight: 23,
                  marginBottom: 24,
                  fontFamily: fontFamily.ui,
                }}
              >
                We sent a password reset link to{' '}
                <Text style={{ fontWeight: '700', color: colors.ink }}>{email.trim()}</Text>. Tap
                it to set a new password.
              </Text>
              <Press scale={false} onPress={() => setMode('login')}>
                <Text
                  allowFontScaling={false}
                  style={{
                    textAlign: 'center',
                    padding: 14,
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.inkMute,
                    fontFamily: fontFamily.ui,
                    lineHeight: 20,
                  }}
                >
                  Back to log in
                </Text>
              </Press>
            </>
          ) : (
            <>
          {/* Heading */}
          <Kick style={{ marginBottom: 8 }}>welcome back</Kick>
          <Serif s={34} style={{ marginBottom: 28 }}>
            Log in to your account
          </Serif>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: colors.inkMute,
                marginBottom: 8,
                lineHeight: 10,
              }}
            >
              Email
            </Text>
            <View
              style={{
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
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.inkMute}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
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
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 12 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: colors.inkMute,
                marginBottom: 8,
                lineHeight: 10,
              }}
            >
              Password
            </Text>
            <View
              style={{
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
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkMute}
                secureTextEntry
                editable={!loading}
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
          </View>

          {/* Forgot password */}
          <Press
            scale={false}
            onPress={() => {
              setEmailError(null);
              setMode('forgot');
            }}
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
          >
            <Text
              allowFontScaling={false}
              style={{
                padding: 4,
                fontSize: 13.5,
                fontWeight: '600',
                color: colors.p2Deep,
                fontFamily: fontFamily.ui,
                lineHeight: 19,
              }}
            >
              Forgot password?
            </Text>
          </Press>

          {/* Log In Button */}
          <Btn
            kind="us"
            onPress={handleLogIn}
            disabled={loading}
            style={{ marginBottom: 12 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              'Log in'
            )}
          </Btn>

          {/* Divider */}
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

          {/* Sign Up Link */}
          <Press scale={false} onPress={handleCreateAccount}>
            <Text
              allowFontScaling={false}
              style={{
                textAlign: 'center',
                padding: 12,
                fontSize: 14,
                fontWeight: '600',
                color: colors.inkMute,
                fontFamily: fontFamily.ui,
                lineHeight: 20,
              }}
            >
              New here? Create an account
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
