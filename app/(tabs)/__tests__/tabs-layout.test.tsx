import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import TabsLayout from '../_layout';

let mockPathname = '/(tabs)/today';
const mockNavigate = jest.fn();
jest.mock('expo-router', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  const Tabs = Object.assign(passthrough, { Screen: () => null });
  return {
    __esModule: true,
    Tabs,
    usePathname: () => mockPathname,
    useRouter: () => ({ navigate: mockNavigate }),
  };
});

// Real device-ish insets so the floating pill's safe-area offset is observable.
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-haptics', () => ({
  __esModule: true,
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// Depth-first search of the rendered JSON for the first node matching a style
// predicate (the floating pill has no testID and TabBar itself must not change).
const findByStyle = (
  node: unknown,
  pred: (s: Record<string, unknown>) => boolean
): { props: { style?: unknown } } | null => {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findByStyle(child, pred);
      if (hit) return hit;
    }
    return null;
  }
  const el = node as { props?: { style?: unknown }; children?: unknown };
  const style = el.props ? (StyleSheet.flatten(el.props.style as never) as Record<string, unknown> | undefined) : undefined;
  if (style && pred(style)) return el as { props: { style?: unknown } };
  return findByStyle(el.children, pred);
};

describe('tabs layout', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    (Haptics.selectionAsync as jest.Mock).mockClear();
    mockPathname = '/(tabs)/today';
  });

  it('floats the tab bar above the home indicator (18 + bottom inset)', async () => {
    const { toJSON } = await render(<TabsLayout />);

    const pill = findByStyle(
      toJSON(),
      (s) => s.position === 'absolute' && s.borderRadius === 999
    );
    expect(pill).not.toBeNull();
    const style = StyleSheet.flatten(pill!.props.style as never) as Record<string, unknown>;
    expect(style.bottom).toBe(52); // 18 + inset 34
    expect(style.height).toBe(62);
  });

  it('marks only the current route as the selected tab', async () => {
    mockPathname = '/(tabs)/us';
    const { getByLabelText } = await render(<TabsLayout />);

    expect(getByLabelText('Us').props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
    expect(getByLabelText('Today').props.accessibilityState).toEqual({
      disabled: false,
      selected: false,
    });
    expect(getByLabelText('Refocus').props.accessibilityState).toEqual({
      disabled: false,
      selected: false,
    });
  });

  it('fires a selection haptic and navigates on tab press', async () => {
    const { getByLabelText } = await render(<TabsLayout />);

    fireEvent.press(getByLabelText('Us'));

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/us');
  });

  it('hides the floating bar inside the full-screen refocus flow', async () => {
    mockPathname = '/(tabs)/refocus';
    const { queryByLabelText } = await render(<TabsLayout />);

    expect(queryByLabelText('Today')).toBeNull();
    expect(queryByLabelText('Us')).toBeNull();
  });
});
