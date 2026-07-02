import React from 'react';
import { render, userEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import RefocusScreen from '../refocus';
import * as refocusContent from '../../../src/content/refocus';

let mockInvoke: jest.Mock;

jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));
jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: null, loading: false }),
}));
jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: null, loading: false, status: 'none' }),
}));
jest.mock('../../../src/features/profile/useIdentity', () => ({
  useIdentity: () => ({
    me: { name: 'Alex', initial: 'A' },
    partner: { name: 'Jordan', initial: 'J', hasPartner: true },
    loading: false,
  }),
}));
jest.mock('../../../src/features/lovemap/addLearning', () => ({
  addLearning: jest.fn(() => Promise.resolve()),
}));

// The real Btn/Press wrap Pressable in Animated.createAnimatedComponent, which
// doesn't receive RNTL presses — mock them with plain Pressables (same pattern
// as onboarding.test.tsx).
jest.mock('../../../src/components/Btn', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return function MockBtn({ children, onPress, disabled, sub, testID }: any) {
    return React.createElement(
      Pressable,
      { onPress, disabled, testID },
      React.createElement(View, {},
        React.createElement(Text, {}, children),
        sub && React.createElement(Text, {}, sub)
      )
    );
  };
});

jest.mock('../../../src/components/Press', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return function MockPress({ children, onPress }: any) {
    return React.createElement(Pressable, { onPress }, children);
  };
});

const REFLECTION: refocusContent.RefocusResult = {
  happened: ['Saturday plans never got settled', 'The texts turned short'],
  angles: ['It could be that the silence read as not being a priority.'],
  underneath: 'You need a little slack when you\'re slammed.',
  wayback: 'A tiny heads-up text keeps quiet from meaning forgotten.',
  bridge: 'hey, i went quiet because work buried me, not because of you 🤍',
};

type Screen = Awaited<ReturnType<typeof render>>;

// userEvent + findBy* are the RNTL v14 fake-timer-safe primitives: they wrap
// updates in act and auto-advance jest fake timers (raw fireEvent + manual
// advanceTimersByTime here either drops updates or overlaps act scopes).
const user = userEvent.setup();

// The waiting step holds a ~4.2s min display before resolving — findBy*
// auto-advances the fake clock until the next step renders.
const SETTLE = { timeout: 6000 };

async function goToShare(screen: Screen) {
  await user.press(screen.getByText('Start, untangle my side'));
  await user.press(await screen.findByText('Type it out'));
  const input = await screen.findByPlaceholderText(
    'What happened, from your side? Say it how you actually feel, messy is fine.'
  );
  await user.type(input, 'we argued about dishes');
  await user.press(screen.getByText('Untangle it'));
}

describe('RefocusScreen — honest solo reflection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockInvoke = jest.fn(() => Promise.resolve({ data: REFLECTION, error: null }));
    (Clipboard.setStringAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('content module exports no partner-side or canned constants', () => {
    const content = refocusContent as Record<string, unknown>;
    expect(content.DANI_SIDE).toBeUndefined();
    expect(content.EXEMPLAR).toBeUndefined();
    expect(content.VOICE_TRANSCRIPT).toBeUndefined();
    expect(content.SAMPLE_LOG).toBeUndefined();
  });

  it('mode picker offers exactly Type and Paste — no voice mode', async () => {
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Start, untangle my side'));

    expect(refocusContent.MODES.map((m) => m.id)).toEqual(['text', 'paste']);
    expect(await screen.findByText('Type it out')).toBeTruthy();
    expect(screen.getByText('Paste your texts')).toBeTruthy();
    expect(screen.queryByText('Voice note')).toBeNull();
  });

  it('paste mode starts with an empty field, not a scripted fight', async () => {
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Start, untangle my side'));
    await user.press(await screen.findByText('Paste your texts'));

    const input = await screen.findByPlaceholderText('Paste the messages here…');
    expect(input.props.value).toBe('');
  });

  it('sends only the user\'s own text to the edge function', async () => {
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);
    await screen.findByText('Your side, in focus.', undefined, SETTLE);

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('refocus', {
      body: {
        userText: 'we argued about dishes',
        partnerName: 'Jordan',
      },
    });
  });

  it('shows an honest error state with retry when the edge function fails', async () => {
    mockInvoke = jest.fn(() => Promise.reject(new Error('network down')));
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);

    expect(
      await screen.findByText('Still a little blurry.', undefined, SETTLE)
    ).toBeTruthy();
    expect(
      screen.getByText(
        'We couldn\'t reach the AI just now. Your words are safe right here, give it another go in a moment.'
      )
    ).toBeTruthy();
    expect(screen.getByTestId('refocus-retry')).toBeTruthy();
  });

  it('shows the error state (not a canned result) when the function returns an error payload', async () => {
    mockInvoke = jest.fn(() =>
      Promise.resolve({ data: null, error: { message: 'not_configured' } })
    );
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);

    expect(
      await screen.findByText('Still a little blurry.', undefined, SETTLE)
    ).toBeTruthy();
    expect(screen.queryByText('Your side, in focus.')).toBeNull();
  });

  it('retry from the error state re-runs the analysis and can reach the result', async () => {
    mockInvoke = jest.fn(() => Promise.reject(new Error('network down')));
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);
    await screen.findByText('Still a little blurry.', undefined, SETTLE);

    mockInvoke = jest.fn(() => Promise.resolve({ data: REFLECTION, error: null }));
    await user.press(screen.getByTestId('refocus-retry'));

    expect(
      await screen.findByText('Your side, in focus.', undefined, SETTLE)
    ).toBeTruthy();
    expect(screen.getByText('Saturday plans never got settled')).toBeTruthy();
  });

  it('renders the reflection with angles framed as possibilities', async () => {
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);

    expect(
      await screen.findByText('Your side, in focus.', undefined, SETTLE)
    ).toBeTruthy();
    expect(
      screen.getByText("Possibilities to sit with, not Jordan's actual words.")
    ).toBeTruthy();
    expect(
      screen.getByText('It could be that the silence read as not being a priority.')
    ).toBeTruthy();
    expect(screen.queryByText('Send to Jordan')).toBeNull();
  });

  it('copies the bridge draft to the clipboard instead of a fake send', async () => {
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);
    await screen.findByText('Your side, in focus.', undefined, SETTLE);

    await user.press(screen.getByText('Copy to share'));

    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      'hey, i went quiet because work buried me, not because of you 🤍'
    );
    expect(await screen.findByText('Copied 🤍')).toBeTruthy();
  });
});
