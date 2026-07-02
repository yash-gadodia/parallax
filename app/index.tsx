import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { flushPendingIntents } from '../src/features/onboarding/flushIntents';
import { supabase } from '../src/lib/supabase';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { DawnBlobs } from '../src/components/DawnBlobs';
import Btn from '../src/components/Btn';
import { Serif } from '../src/components/Text';
import { colors, gradients, space } from '../src/design/tokens';
import { fontFamily } from '../src/design/typography';

export default function HomeScreen() {
  // "Try again" remounts the gate: useCouple fetches once per mount and exposes
  // no refetch handle, so a fresh key IS the refetch.
  const [attempt, setAttempt] = useState(0);
  return <Gate key={attempt} onRetry={() => setAttempt((a) => a + 1)} />;
}

function Gate({ onRetry }: { onRetry: () => void }) {
  const { session, loading: sessionLoading } = useSession();
  const { status, loading: coupleLoading } = useCouple();
  // useCouple reports a failed lookup identically to "no couple" (status 'none'),
  // so before dumping a possibly-paired user into onboarding, probe whether the
  // couples table is reachable at all. Probe error -> honest retry state.
  const [probe, setProbe] = useState<'pending' | 'ok' | 'error'>('pending');

  useEffect(() => {
    if (session?.user?.id) {
      flushPendingIntents(session.user.id);
    }
  }, [session?.user?.id]);

  const needsProbe =
    !sessionLoading && !coupleLoading && !!session && status === 'none';

  useEffect(() => {
    if (!needsProbe) return;
    let cancelled = false;
    supabase
      .from('couples')
      .select('id')
      .limit(1)
      .then(({ error }) => {
        if (!cancelled) setProbe(error ? 'error' : 'ok');
      });
    return () => {
      cancelled = true;
    };
  }, [needsProbe]);

  // Wait for auth (and the couple lookup, once we know there's a session)
  // before routing, so a returning user never flashes onboarding. Branded
  // frame while we wait - never a blank one.
  if (sessionLoading || (session && coupleLoading)) return <BrandedLoading />;

  // A paired (active) OR pairing-pending user belongs in the app: pending users
  // answer their own half ahead of time; the reveal stays server-held until the
  // partner joins (migration 0011). Only a user with no couple yet ('none') goes
  // to onboarding to create/join an invite.
  if (session && (status === 'active' || status === 'pending')) {
    return <Redirect href="/(tabs)/today" />;
  }

  if (needsProbe && probe === 'pending') return <BrandedLoading />;
  if (needsProbe && probe === 'error') return <ConnectionError onRetry={onRetry} />;

  return <Redirect href="/(onboarding)" />;
}

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <LinearGradient
      colors={gradients.dawn.colors}
      locations={gradients.dawn.locations}
      style={{ flex: 1 }}
    >
      <DawnBlobs />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.gutter,
        }}
      >
        <View style={{ alignItems: 'center', maxWidth: 320, width: '100%' }}>
          <Serif s={26} style={{ textAlign: 'center', marginBottom: 10 }}>
            can’t reach parallax
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
            Check your connection and try again.
          </Text>
          <View style={{ width: '100%' }}>
            <Btn kind="us" onPress={onRetry} testID="retry-couple">
              Try again
            </Btn>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
