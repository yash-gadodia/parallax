import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import TabBar from '../../src/components/TabBar';

type TabName = 'home' | 'refocus' | 'us';
type RouteName = 'today' | 'refocus' | 'us';

const routeToTab: Record<RouteName, TabName> = {
  today: 'home',
  refocus: 'refocus',
  us: 'us',
};

const tabToRoute: Record<TabName, RouteName> = {
  home: 'today',
  refocus: 'refocus',
  us: 'us',
};

interface TabBarProps {
  state: { routes: Array<{ name: string }>, index: number };
  navigation: { navigate: (route: string) => void };
  descriptors: Record<string, any>;
  insets: { bottom: number };
}

export default function TabsLayout(): ReactNode {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: TabBarProps) => {
        const current = props.state.routes[props.state.index].name as keyof typeof routeToTab;
        return (
          <TabBar
            active={routeToTab[current] ?? 'home'}
            go={(t) => props.navigation.navigate(tabToRoute[t] as never)}
          />
        );
      }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="refocus" />
      <Tabs.Screen name="us" />
    </Tabs>
  );
}
