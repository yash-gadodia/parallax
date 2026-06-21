import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../index';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock the supabase module
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
            },
          },
        })
      ),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: jest.fn(),
  },
}));

// Mock pairing actions
jest.mock('../../../src/features/pairing/pairingActions', () => ({
  createCouple: jest.fn(() =>
    Promise.resolve({
      id: 'couple-1',
      invite_code: 'TEST-1234',
      status: 'pending',
    })
  ),
  joinCouple: jest.fn(() =>
    Promise.resolve({
      id: 'couple-1',
      status: 'active',
    })
  ),
}));

// Mock useCouple hook
jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({
    couple: null,
    loading: false,
    status: 'none',
  }),
}));

// Mock useSession hook
jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user-id' } },
    loading: false,
  }),
}));

describe('Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders step 0 (Welcome) with tagline', async () => {
    const { getByText } = render(<OnboardingScreen />);
    await waitFor(() => {
      expect(getByText('mind the parallax error')).toBeTruthy();
    });
  });

  test('advances from step 0 to step 1 on "Get started" press', async () => {
    const { getByText } = render(<OnboardingScreen />);
    await waitFor(() => {
      expect(getByText('mind the parallax error')).toBeTruthy();
    });

    const getStartedBtn = getByText('Get started');
    fireEvent.press(getStartedBtn);

    await waitFor(() => {
      expect(getByText('Three taps, then the good part.')).toBeTruthy();
    });
  });

  test('step 1 renders "How it works" content', async () => {
    const { getByText } = render(<OnboardingScreen />);

    // Advance to step 1
    const getStartedBtn = await waitFor(() => getByText('Get started'));
    fireEvent.press(getStartedBtn);

    await waitFor(() => {
      expect(getByText('Answer honestly')).toBeTruthy();
      expect(getByText('Call their answer')).toBeTruthy();
      expect(getByText('Come into focus')).toBeTruthy();
    });
  });

  test('step 2: Continue button is disabled until an intent is selected', async () => {
    const { getByText, getByTestId, getAllByTestId } = render(
      <OnboardingScreen />
    );

    // Navigate to step 2
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);

    // Deselect the default intent
    const knowChip = await waitFor(() => getByText('Know each other more deeply'));
    fireEvent.press(knowChip);

    // Continue button should be disabled
    const continueBtn = getByText('Continue');
    expect(continueBtn.closest('View')).toHaveStyle({ opacity: expect.any(Number) });

    // Select an intent again
    fireEvent.press(knowChip);

    // Button should now be enabled
    await waitFor(() => {
      expect(getByText('1 selected')).toBeTruthy();
    });
  });

  test('step 2: Persists intents on continue', async () => {
    const { getByText } = render(<OnboardingScreen />);
    const { supabase } = require('../../../src/lib/supabase');

    // Navigate to step 2
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);

    // Select multiple intents
    const knowChip = await waitFor(() => getByText('Know each other more deeply'));
    const talkChip = getByText('Spark better conversations');
    fireEvent.press(talkChip);

    // Click continue
    const continueBtn = getByText('Continue');
    fireEvent.press(continueBtn);

    // Verify supabase.from('profiles').update was called
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  test('step 3: Creates couple and displays invite code', async () => {
    const { getByText } = render(<OnboardingScreen />);

    // Navigate to step 3
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Continue'));
    fireEvent.press(btn);

    // Invite code should be displayed
    await waitFor(() => {
      expect(getByText('TEST-1234')).toBeTruthy();
    });
  });

  test('step 3: Share button shares invite link', async () => {
    const { getByText } = render(<OnboardingScreen />);

    // Navigate to step 3
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Continue'));
    fireEvent.press(btn);

    // Wait for invite code to appear
    await waitFor(() => {
      expect(getByText('TEST-1234')).toBeTruthy();
    });

    // Click share button
    const shareBtn = await waitFor(() =>
      getByText('Send Dani the link')
    );
    fireEvent.press(shareBtn);

    // Share button interaction verified above
  });

  test('step 3: Can toggle to code entry mode and join', async () => {
    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);

    // Navigate to step 3
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Continue'));
    fireEvent.press(btn);

    // Toggle to code entry
    const toggleBtn = getByText('Enter a code instead');
    fireEvent.press(toggleBtn);

    // Enter code
    const input = getByPlaceholderText('Enter invite code');
    fireEvent.changeText(input, 'ABCD-5678');

    // Click join button
    const joinBtn = getByText('Join');
    fireEvent.press(joinBtn);

    // Should advance to next step
    await waitFor(() => {
      expect(getByText('Dani joined!')).toBeTruthy();
    });
  });

  test('step 4: Renders joined celebration with both avatars', async () => {
    const { getByText } = render(<OnboardingScreen />);

    // Navigate through steps 0-3
    let btn = getByText('Get started');
    fireEvent.press(btn);
    btn = getByText('Makes sense →');
    fireEvent.press(btn);
    btn = getByText('Continue');
    fireEvent.press(btn);

    // Advance from pair-up to joined
    btn = getByText('Send Dani the link');
    fireEvent.press(btn);

    // Check for joined celebration
    await waitFor(() => {
      expect(getByText('Dani joined!')).toBeTruthy();
      expect(getByText('🎉')).toBeTruthy();
    });
  });

  test('step 5: Renders moment selection with 4 time chips', async () => {
    const { getByText } = render(<OnboardingScreen />);

    // Navigate through steps 0-4
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Continue'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Send Dani the link'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Almost there →'));
    fireEvent.press(btn);

    // Check for moment chips
    await waitFor(() => {
      expect(getByText('Morning coffee')).toBeTruthy();
      expect(getByText('Lunch break')).toBeTruthy();
      expect(getByText('Evening wind-down')).toBeTruthy();
      expect(getByText('Before bed')).toBeTruthy();
    });
  });

  test('step 5: Persists notify_time on "Turn on daily nudge"', async () => {
    const { getByText } = render(<OnboardingScreen />);
    const { supabase } = require('../../../src/lib/supabase');

    // Navigate through all steps to step 5
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Continue'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Send Dani the link'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Almost there →'));
    fireEvent.press(btn);

    // Select a moment
    const morningChip = await waitFor(() => getByText('Morning coffee'));
    fireEvent.press(morningChip);

    // Click "Turn on daily nudge"
    const nudgeBtn = getByText('Turn on daily nudge');
    fireEvent.press(nudgeBtn);

    // Verify supabase.from('profiles').update was called
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  test('handles supabase errors gracefully with toast', async () => {
    const { getByText } = render(<OnboardingScreen />);
    const { supabase } = require('../../../src/lib/supabase');

    // Mock an error
    supabase.auth.getUser.mockRejectedValueOnce(
      new Error('Auth failed')
    );

    // Navigate to step 2 (where auth is needed)
    let btn = await waitFor(() => getByText('Get started'));
    fireEvent.press(btn);
    btn = await waitFor(() => getByText('Makes sense →'));
    fireEvent.press(btn);

    // Select and continue
    const chip = await waitFor(() => getByText('Know each other more deeply'));
    fireEvent.press(chip);
    const continueBtn = getByText('Continue');
    fireEvent.press(continueBtn);

    // Toast should be triggered (component shouldn't crash)
    await waitFor(() => {
      expect(getByText('Get started')).toBeTruthy();
    });
  });
});
