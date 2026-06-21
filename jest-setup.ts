import '@testing-library/react-native/matchers';

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
