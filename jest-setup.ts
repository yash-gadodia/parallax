import '@testing-library/react-native/matchers';

// Default Supabase env so src/lib/supabase.ts constructs in tests (no real network is hit
// in render-smoke tests). The env-missing-throw test deletes these itself.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// AsyncStorage's native module isn't available in jest — use its official mock
// (supabase.ts imports it for auth persistence).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock the Supabase client so screen render-smoke tests don't hit the network
// (clean empty results -> pristine output). Tests that need specific behavior
// mock '../lib/supabase' locally and override this.
jest.mock('@supabase/supabase-js', () => {
  const makeQuery = () => {
    const q: any = {};
    const chain = [
      'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'or',
      'in', 'is', 'order', 'limit', 'range', 'filter', 'match', 'gte', 'lte',
    ];
    chain.forEach((m) => { q[m] = () => q; });
    q.single = () => Promise.resolve({ data: null, error: null });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.then = (resolve: (v: { data: never[]; error: null }) => unknown) =>
      resolve({ data: [], error: null });
    return q;
  };
  const channel = () => {
    const c: any = {};
    c.on = () => c;
    c.subscribe = () => c;
    c.unsubscribe = () => {};
    return c;
  };
  return {
    createClient: () => ({
      from: () => makeQuery(),
      rpc: () => Promise.resolve({ data: null, error: null }),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
      channel,
      removeChannel: () => {},
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: { session: null }, error: null }),
        signUp: () => Promise.resolve({ data: { session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithIdToken: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    }),
  };
});

// Mock reanimated to avoid native module initialization
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Animated = require('react-native').Animated;

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: any) => component,
    },
    Animated: {
      ...Animated,
      View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: (init: any) => {
      const value = { value: init };
      return new Proxy(value, {
        get(target: any, prop: any) {
          if (prop === 'value') return target.value;
          if (prop === 'get') return () => target.value;
          if (prop === 'set') return (newValue: any) => {
            target.value = typeof newValue === 'function' ? newValue(target.value) : newValue;
          };
        },
        set(target: any, prop: any, newValue: any) {
          if (prop === 'value') target.value = newValue;
          return true;
        },
      });
    },
    useAnimatedStyle: (callback: any) => callback(),
    useAnimatedProps: (callback: any) => callback(),
    useAnimatedReaction: () => {},
    useAnimatedRef: () => ({ current: null }),
    useAnimatedScrollHandler: () => {},
    useDerivedValue: (callback: any) => ({ value: callback(), get: () => callback() }),
    useAnimatedSensor: () => ({ sensor: { value: { x: 0, y: 0, z: 0 } } }),
    withTiming: (target: any, config?: any) => target,
    withSpring: (target: any, config?: any) => target,
    withDecay: (config: any) => 0,
    withRepeat: (anim: any) => anim,
    withSequence: (...anims: any[]) => anims[anims.length - 1],
    withDelay: (_delay: any, anim: any) => anim,
    Easing: {
      linear: () => 0,
      ease: () => 0,
      quad: () => 0,
      cubic: () => 0,
      bezier: () => () => 0,
      in: (fn: any) => fn,
      out: (fn: any) => fn,
      inOut: (fn: any) => fn,
    },
    cancelAnimation: () => {},
    getAnimatedStyle: () => ({}),
    setUpTests: () => {},
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaInsetsContext: { Provider: ({ children }: any) => children },
    SafeAreaFrameContext: { Provider: ({ children }: any) => children },
  };
});

// Mock expo-router (avoids its ESM-only deps in jest + gives screens a router)
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = ({ children }: any) => children ?? null;
  const Stack: any = passthrough;
  Stack.Screen = () => null;
  const Tabs: any = passthrough;
  Tabs.Screen = () => null;
  return {
    __esModule: true,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismiss: jest.fn() }),
    useLocalSearchParams: () => ({}),
    useGlobalSearchParams: () => ({}),
    usePathname: () => '/',
    useSegments: () => [],
    useFocusEffect: () => {},
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn() },
    Link: ({ children }: any) => React.createElement(View, null, children),
    Redirect: () => null,
    Stack,
    Tabs,
    Slot: passthrough,
  };
});

// RevenueCat native modules — absent in jest. The app guards their require() at
// runtime, but mock them so any code path that loads them stays inert in tests.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    getOfferings: jest.fn(() => Promise.resolve({ current: null })),
    addCustomerInfoUpdateListener: jest.fn(),
    purchasePackage: jest.fn(() => Promise.resolve({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
  },
}));
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentPaywall: jest.fn(() => Promise.resolve('NOT_PRESENTED')),
    presentPaywallIfNeeded: jest.fn(() => Promise.resolve('NOT_PRESENTED')),
    presentCustomerCenter: jest.fn(() => Promise.resolve()),
  },
}));

// expo-blur's BlurView is native — render it as a plain View in jest so screens
// that frost content (reveal, checkout, packDetail, wrapped, homeScreen, Sheet) test cleanly.
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    BlurView: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});
