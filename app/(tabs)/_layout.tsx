import { Tabs, usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabBar from '../../src/components/TabBar';
import { gradients } from '../../src/design/tokens';

type TabName = 'home' | 'refocus' | 'us';

const tabToRoute: Record<TabName, string> = {
  home: '/(tabs)/today',
  refocus: '/(tabs)/refocus',
  us: '/(tabs)/us',
};

export default function TabsLayout(): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // "refocus" contains "us", so check it first.
  const onRefocus = pathname.includes('refocus');
  const active: TabName = onRefocus
    ? 'refocus'
    : pathname.includes('/us')
      ? 'us'
      : 'home';

  // The floating pill leaves a gap (margin + home indicator) beneath it where
  // scroll content would otherwise poke through. A scrim fades content out and
  // fills that gap with the screen's own bottom colour (dawn end).
  const gapH = 18 + insets.bottom;
  const scrimH = gapH + 64;

  // Refocus is a full-screen flow launched from the nav (design: showNav excludes it),
  // so the floating bar hides while you're inside it — its TopBar back is the exit.
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      >
        <Tabs.Screen name="today" />
        <Tabs.Screen name="refocus" />
        <Tabs.Screen name="us" />
      </Tabs>
      {!onRefocus && (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', gradients.dawn.colors[2], gradients.dawn.colors[2]]}
            locations={[0, 64 / scrimH, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: scrimH }}
          />
          <TabBar active={active} go={(t) => router.navigate(tabToRoute[t] as never)} />
        </>
      )}
    </View>
  );
}
