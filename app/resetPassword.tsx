import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, shadows, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';
import { Kick, Serif } from '../src/components/Text';
import Btn from '../src/components/Btn';
import { Wordmark } from '../src/components/Wordmark';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Toast from '../src/components/Toast';
import { useUiStore } from '../src/store/ui';
import { updatePassword, humanAuthError } from '../src/features/auth/authActions';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { toast, fireToast } = useUiStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (password.length < 6) {
      fireToast('Password needs at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      fireToast('Password updated');
      router.replace('/');
    } catch (err) {
      fireToast(humanAuthError(err, "couldn't update your password — try again in a sec"));
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

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 40 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: 72 }} />

          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Wordmark size={48} />
          </View>

          <Kick style={{ marginBottom: 8 }}>almost back in</Kick>
          <Serif s={34} style={{ marginBottom: 28 }}>
            Set a new password
          </Serif>

          <View style={{ marginBottom: 28 }}>
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
              New password
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
                placeholder="at least 6 characters"
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

          <Btn kind="us" onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Save new password'}
          </Btn>
        </ScrollView>
      </SafeAreaView>

      {toast && <Toast msg={toast} />}
    </View>
  );
}
