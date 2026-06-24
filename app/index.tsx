import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '../src/features/auth/useSession';
import { useCouple } from '../src/features/pairing/useCouple';
import { flushPendingIntents } from '../src/features/onboarding/flushIntents';

export default function HomeScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { status, loading: coupleLoading } = useCouple();

  useEffect(() => {
    if (session?.user?.id) {
      flushPendingIntents(session.user.id);
    }
  }, [session?.user?.id]);

  // Wait for auth (and the couple lookup, once we know there's a session)
  // before routing, so a returning user never flashes onboarding.
  if (sessionLoading || (session && coupleLoading)) return null;

  if (session && status === 'active') {
    return <Redirect href="/(tabs)/today" />;
  }
  return <Redirect href="/(onboarding)" />;
}
