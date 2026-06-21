import { Tabs, usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import TabBar from '../../src/components/TabBar';

type TabName = 'home' | 'refocus' | 'us';

const tabToRoute: Record<TabName, string> = {
  home: '/(tabs)/today',
  refocus: '/(tabs)/refocus',
  us: '/(tabs)/us',
};

export default function TabsLayout(): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  // "refocus" contains "us", so check it first.
  const onRefocus = pathname.includes('refocus');
  const active: TabName = onRefocus
    ? 'refocus'
    : pathname.includes('/us')
      ? 'us'
      : 'home';

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
        <TabBar active={active} go={(t) => router.navigate(tabToRoute[t] as never)} />
      )}
    </View>
  );
}
