import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { extractInviteCodeFromLink } from '../src/domain/inviteCode';
import { useOnboardingStore } from '../src/store/onboarding';
import { track, EVENTS } from '../src/lib/analytics';

// Handles parallax://join?code=XXXX-1234 deep links.
// Stashes the code in the onboarding store so Step3PairUp can prefill the
// join-by-code input, then routes into the onboarding flow at the pair-up step.
//
// TODO (Yash): for https universal links you need to:
//   1. Host /.well-known/apple-app-site-association on your domain (HTTPS, no redirect).
//   2. Add the "associatedDomains" entitlement to app.json under ios:
//        "associatedDomains": ["applinks:yourdomain.com"]
//   3. Register the domain in App Store Connect and enable Associated Domains capability.
//   Until then, the parallax:// custom scheme (handled here) is the only working path.
export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { setPendingInviteCode } = useOnboardingStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof code === 'string') {
      // Try to parse code as a raw value (no full URL here — expo-router already
      // stripped the query params for us).
      const fullUrl = `parallax://join?code=${encodeURIComponent(code)}`;
      const extracted = extractInviteCodeFromLink(fullUrl);
      setPendingInviteCode(extracted);
      // D0 funnel: invite link was opened
      track(EVENTS.INVITE_LINK_OPENED);
    } else {
      setPendingInviteCode(null);
    }

    // Route into onboarding; the root guard in app/index.tsx will redirect to
    // (tabs)/today if the user is already paired — safe to always go to onboarding.
    router.replace('/(onboarding)');
  }, [code, setPendingInviteCode, router]);

  return null;
}
