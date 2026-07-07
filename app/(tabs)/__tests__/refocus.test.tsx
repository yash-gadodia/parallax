import React from 'react';
import { render, userEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import RefocusScreen from '../refocus';
import * as refocusContent from '../../../src/content/refocus';
import type { RefocusSession } from '../../../src/types/db';

let mockInvoke: jest.Mock;
let mockAuthSession: { user: { id: string } } | null = null;
let mockCouple: { id: string } | null = null;
let mockRfSession: RefocusSession | null = null;
let mockStartRefocus: jest.Mock;
let mockAddRefocusSide: jest.Mock;
let mockMediateSession: jest.Mock;

jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));
jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: mockAuthSession, loading: false }),
}));
jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({
    couple: mockCouple,
    loading: false,
    status: mockCouple ? 'active' : 'none',
  }),
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
jest.mock('../../../src/features/refocus/useRefocusSession', () => ({
  useRefocusSession: () => ({
    session: mockRfSession,
    loading: false,
    error: null,
    refresh: jest.fn(() => Promise.resolve()),
  }),
}));
jest.mock('../../../src/features/refocus/refocusActions', () => ({
  ...jest.requireActual('../../../src/features/refocus/refocusActions'),
  startRefocus: (...args: unknown[]) => mockStartRefocus(...args),
  addRefocusSide: (...args: unknown[]) => mockAddRefocusSide(...args),
  mediateSession: (...args: unknown[]) => mockMediateSession(...args),
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

const MEDIATION: refocusContent.RefocusMediation = {
  type: 'mediation',
  shared_ground: 'you both want the weekend to feel like yours, together',
  initiator_underneath: 'wanting the planning load to be seen',
  partner_underneath: 'wanting quiet to not be read as distance',
  initiator_bridge: 'hey, can we pick one weekend thing together this week 🤍',
  partner_bridge: 'hey, my quiet was tiredness, never distance 🤍',
};

const CRISIS: refocusContent.RefocusSafety = {
  type: 'crisis',
  title: 'Before anything else, you matter.',
  message: 'Please reach out now, you don\'t have to have it figured out first.',
  helplines: [
    { name: 'SOS (Samaritans of Singapore), 24h', contact: '1767' },
    { name: 'Anywhere else in the world', contact: 'findahelpline.com' },
  ],
};

const SESSION: RefocusSession = {
  id: 'session-1',
  couple_id: 'couple-1',
  initiator: 'me',
  topic: 'the dishes thing',
  initiator_side: 'i felt alone with the mess',
  partner_side: null,
  state: 'waiting_partner',
  ai_result: null,
  created_at: '2026-07-01T10:00:00Z',
  partner_joined_at: null,
  revealed_at: null,
  is_solo: false,
  solo_saved_at: null,
};

type Screen = Awaited<ReturnType<typeof render>>;

// userEvent + findBy* are the RNTL v14 fake-timer-safe primitives: they wrap
// updates in act and auto-advance jest fake timers (raw fireEvent + manual
// advanceTimersByTime here either drops updates or overlaps act scopes).
const user = userEvent.setup();

// The waiting steps hold a min display (4.2s solo / 2.5s together) before
// resolving — findBy* auto-advances the fake clock until the next step renders.
const SETTLE = { timeout: 6000 };

async function goToShare(screen: Screen) {
  await user.press(screen.getByText('Just my side'));
  await user.press(await screen.findByText('Type it out'));
  const input = await screen.findByPlaceholderText(
    'What happened, from your side? Say it how you actually feel, messy is fine.'
  );
  await user.type(input, 'we argued about dishes');
  await user.press(screen.getByText('Untangle it'));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockInvoke = jest.fn(() => Promise.resolve({ data: REFLECTION, error: null }));
  mockStartRefocus = jest.fn(() => Promise.resolve('session-1'));
  mockAddRefocusSide = jest.fn(() => Promise.resolve());
  mockMediateSession = jest.fn(() => Promise.resolve(MEDIATION));
  mockAuthSession = null;
  mockCouple = null;
  mockRfSession = null;
  (Clipboard.setStringAsync as jest.Mock).mockClear();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('RefocusScreen — honest solo reflection', () => {
  it('content module exports no partner-side or canned constants', () => {
    const content = refocusContent as Record<string, unknown>;
    expect(content.DANI_SIDE).toBeUndefined();
    expect(content.EXEMPLAR).toBeUndefined();
    expect(content.VOICE_TRANSCRIPT).toBeUndefined();
    expect(content.SAMPLE_LOG).toBeUndefined();
  });

  it('unpaired intro offers only the solo path (no together CTA to nowhere)', async () => {
    const screen = await render(<RefocusScreen />);
    expect(screen.getByText('Just my side')).toBeTruthy();
    expect(screen.queryByText('Untangle it together')).toBeNull();
  });

  it('mode picker offers exactly Type and Paste — no voice mode', async () => {
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Just my side'));

    expect(refocusContent.MODES.map((m) => m.id)).toEqual(['text', 'paste']);
    expect(await screen.findByText('Type it out')).toBeTruthy();
    expect(screen.getByText('Paste your texts')).toBeTruthy();
    expect(screen.queryByText('Voice note')).toBeNull();
  });

  it('paste mode starts with an empty field, not a scripted fight', async () => {
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Just my side'));
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

  it('every solo result carries the AI disclosure + therapy disclaimer', async () => {
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);
    await screen.findByText('Your side, in focus.', undefined, SETTLE);

    expect(
      screen.getByText(
        `${refocusContent.AI_DISCLOSURE} ${refocusContent.THERAPY_DISCLAIMER}`
      )
    ).toBeTruthy();
  });

  it('appends the safety-check-unavailable note when screening failed open', async () => {
    mockInvoke = jest.fn(() =>
      Promise.resolve({
        data: { ...REFLECTION, screening_unavailable: true },
        error: null,
      })
    );
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);
    await screen.findByText('Your side, in focus.', undefined, SETTLE);

    expect(
      screen.getByText(refocusContent.SCREENING_UNAVAILABLE_NOTE)
    ).toBeTruthy();
  });

  it('a crisis verdict shows the helplines screen, never a reflection', async () => {
    mockInvoke = jest.fn(() =>
      Promise.resolve({ data: { safety: CRISIS }, error: null })
    );
    const screen = await render(<RefocusScreen />);
    await goToShare(screen);

    expect(
      await screen.findByText('Before anything else, you matter.', undefined, SETTLE)
    ).toBeTruthy();
    expect(screen.getByText('SOS (Samaritans of Singapore), 24h')).toBeTruthy();
    expect(screen.getByText('1767')).toBeTruthy();
    expect(screen.getByText('findahelpline.com')).toBeTruthy();
    expect(screen.queryByText('Your side, in focus.')).toBeNull();
    expect(screen.queryByText('Copy to share')).toBeNull();
  });
});

describe('RefocusScreen — two-sided sessions (4.6)', () => {
  beforeEach(() => {
    mockAuthSession = { user: { id: 'me' } };
    mockCouple = { id: 'couple-1' };
  });

  it('paired intro offers both paths: together and solo', async () => {
    const screen = await render(<RefocusScreen />);

    expect(screen.getByText('Untangle it together')).toBeTruthy();
    expect(screen.getByText('Just my side')).toBeTruthy();
  });

  it('initiator starts a session: topic + side go through start_refocus, then the waiting state', async () => {
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Untangle it together'));

    const topicInput = await screen.findByPlaceholderText(
      "What's it about? (a few words)"
    );
    await user.type(topicInput, 'the dishes thing');
    const sideInput = screen.getByPlaceholderText(
      'Your side of it, honestly. Messy is fine.'
    );
    await user.type(sideInput, 'i felt alone with the mess this week');
    await user.press(screen.getByTestId('refocus-together-submit'));

    expect(mockStartRefocus).toHaveBeenCalledTimes(1);
    expect(mockStartRefocus).toHaveBeenCalledWith(
      'couple-1',
      'the dishes thing',
      'i felt alone with the mess this week'
    );
    expect(await screen.findByText('waiting for Jordan…')).toBeTruthy();
    expect(screen.getByText('Your side is in')).toBeTruthy();
  });

  it('an already-open session bounces the initiator back to intro with the in-progress card', async () => {
    mockStartRefocus = jest.fn(() =>
      Promise.reject(new Error('refocus_session_already_open'))
    );
    const screen = await render(<RefocusScreen />);
    await user.press(screen.getByText('Untangle it together'));

    const topicInput = await screen.findByPlaceholderText(
      "What's it about? (a few words)"
    );
    await user.type(topicInput, 'another thing');
    await user.type(
      screen.getByPlaceholderText('Your side of it, honestly. Messy is fine.'),
      'more words here'
    );
    await user.press(screen.getByTestId('refocus-together-submit'));

    expect(await screen.findByText('you two already have one open 💛')).toBeTruthy();
    expect(screen.queryByText('waiting for Jordan…')).toBeNull();
  });

  it("the invited partner's tab lands on add-your-side with the initiator's topic", async () => {
    mockRfSession = { ...SESSION, initiator: 'other' };
    const screen = await render(<RefocusScreen />);

    expect(
      await screen.findByText('Jordan wants to refocus: the dishes thing')
    ).toBeTruthy();

    const sideInput = screen.getByPlaceholderText(
      'Your side of it, honestly. Messy is fine.'
    );
    await user.type(sideInput, 'i shut down when it piles up');
    await user.press(screen.getByTestId('refocus-add-side'));

    expect(mockAddRefocusSide).toHaveBeenCalledTimes(1);
    expect(mockAddRefocusSide).toHaveBeenCalledWith(
      'session-1',
      'i shut down when it piles up'
    );
    // adding the side flows into mediation
    expect(await screen.findByText('both sides are in…')).toBeTruthy();
  });

  it('a ready session mediates and shows the shared middle ground to the initiator', async () => {
    mockRfSession = {
      ...SESSION,
      partner_side: 'i shut down when it piles up',
      state: 'ready',
    };
    const screen = await render(<RefocusScreen />);

    expect(await screen.findByText('both sides are in…')).toBeTruthy();
    expect(
      await screen.findByText('"the dishes thing"', undefined, SETTLE)
    ).toBeTruthy();

    expect(mockMediateSession).toHaveBeenCalledWith('session-1');
    expect(
      screen.getByText('you both want the weekend to feel like yours, together')
    ).toBeTruthy();
    // the initiator sees their own underneath (result + love-map card) AND the partner's
    expect(screen.getAllByText('wanting the planning load to be seen')).toHaveLength(2);
    expect(screen.getByText('wanting quiet to not be read as distance')).toBeTruthy();
    // the initiator's editable bridge is theirs, not the partner's
    expect(
      screen.getByDisplayValue('hey, can we pick one weekend thing together this week 🤍')
    ).toBeTruthy();
    // disclosure on the shared result too
    expect(
      screen.getByText(
        `${refocusContent.AI_DISCLOSURE} ${refocusContent.THERAPY_DISCLAIMER}`
      )
    ).toBeTruthy();
  });

  it('a revealed session renders the stored result for the partner with THEIR bridge', async () => {
    mockRfSession = {
      ...SESSION,
      initiator: 'other',
      partner_side: 'i shut down when it piles up',
      state: 'revealed',
      ai_result: MEDIATION,
      revealed_at: '2026-07-01T12:00:00Z',
    };
    const screen = await render(<RefocusScreen />);

    expect(await screen.findByText('"the dishes thing"')).toBeTruthy();
    // no second mediation call — the stored ai_result renders directly
    expect(mockMediateSession).not.toHaveBeenCalled();
    expect(
      screen.getByDisplayValue('hey, my quiet was tiredness, never distance 🤍')
    ).toBeTruthy();
  });

  it('a crisis verdict on a session shows helplines to this member too', async () => {
    mockRfSession = {
      ...SESSION,
      partner_side: 'their side',
      state: 'ready',
    };
    mockMediateSession = jest.fn(() => Promise.resolve(CRISIS));
    const screen = await render(<RefocusScreen />);

    expect(
      await screen.findByText('Before anything else, you matter.', undefined, SETTLE)
    ).toBeTruthy();
    expect(screen.getByText('1767')).toBeTruthy();
    expect(screen.queryByText('"the dishes thing"')).toBeNull();
  });

  it('a failed mediation shows the honest error state with retry', async () => {
    mockRfSession = { ...SESSION, partner_side: 'their side', state: 'ready' };
    mockMediateSession = jest.fn(() => Promise.resolve(null));
    const screen = await render(<RefocusScreen />);

    expect(
      await screen.findByText('Still a little blurry.', undefined, SETTLE)
    ).toBeTruthy();

    mockMediateSession = jest.fn(() => Promise.resolve(MEDIATION));
    await user.press(screen.getByTestId('refocus-retry'));

    expect(
      await screen.findByText('"the dishes thing"', undefined, SETTLE)
    ).toBeTruthy();
  });

  it('an expired session offers a fresh start', async () => {
    mockRfSession = { ...SESSION, state: 'expired' };
    const screen = await render(<RefocusScreen />);

    expect(await screen.findByText('This one faded.')).toBeTruthy();
    expect(screen.getByTestId('refocus-start-fresh')).toBeTruthy();
  });
});
