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
  const active: TabName = pathname.includes('refocus')
    ? 'refocus'
    : pathname.includes('/us')
      ? 'us'
      : 'home';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      >
        <Tabs.Screen name="today" />
        <Tabs.Screen name="refocus" />
        <Tabs.Screen name="us" />
      </Tabs>
      <TabBar active={active} go={(t) => router.navigate(tabToRoute[t] as never)} />
    </View>
  );
}
