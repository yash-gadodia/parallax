import { useState } from 'react';
import { Stack } from 'expo-router';
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

export default function TabsLayout() {
  const [activeTab, setActiveTab] = useState<TabName>('home');

  const handleTabChange = (tabName: TabName) => {
    setActiveTab(tabName);
    const route = tabToRoute[tabName];
    // Navigation handled by Stack
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="today" />
        <Stack.Screen name="refocus" />
        <Stack.Screen name="us" />
      </Stack>
      <TabBar active={activeTab} go={handleTabChange} />
    </>
  );
}
