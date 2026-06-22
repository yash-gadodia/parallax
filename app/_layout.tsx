import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAppFonts } from '../src/design/fonts';
import { queryClient } from '../src/lib/queryClient';
import { usePurchases } from '../src/features/purchases/usePurchases';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Initialise RevenueCat once (real SDK in a dev build; no-op in Expo Go).
    usePurchases.getState().configure();
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
