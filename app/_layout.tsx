import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAppFonts } from '../src/design/fonts';
import { queryClient } from '../src/lib/queryClient';
import { usePurchases } from '../src/features/purchases/usePurchases';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { flushQueue } from '../src/lib/offlineQueue';
import { submitMyAnswers } from '../src/features/drops/dropActions';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Initialise RevenueCat once (real SDK in a dev build; no-op in Expo Go).
    usePurchases.getState().configure();

    // Flush any pending offline submissions on app start (fire-and-forget).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        flushQueue(submitMyAnswers);
      }
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppErrorBoundary>
            <Stack screenOptions={{ headerShown: false }} />
          </AppErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
