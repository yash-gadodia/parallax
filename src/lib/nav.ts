import { useRouter } from 'expo-router';

type AppRouter = ReturnType<typeof useRouter>;

// Pop if there's a back-stack, otherwise go home. Prevents the navigator's
// "The action 'GO_BACK' was not handled" error when a screen is opened with no
// history (deep link, notification, or as the first route).
export function safeBack(router: AppRouter): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/today');
  }
}
