import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock all dependencies BEFORE importing the component

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

// Mock components - use React.createElement to avoid scoping issues with jest.mock
jest.mock('../../../src/components/Peek', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Peek: ({ size, mood }: any) => React.createElement(View, { testID: `peek-${mood}` }),
  };
});

jest.mock('../../../src/components/Wordmark', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Wordmark: ({ size }: any) => React.createElement(View, { testID: 'wordmark' }),
  };
});

jest.mock('../../../src/components/Text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Serif: ({ children, s, italic, c, style }: any) =>
      React.createElement(Text, { testID: 'serif', style }, children),
    Kick: ({ children, c }: any) =>
      React.createElement(Text, { testID: 'kick' }, children),
  };
});

jest.mock('../../../src/components/Btn', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, onPress, disabled, sub, kind }: any) =>
      React.createElement(
        View,
        { testID: `btn-${kind || 'default'}`, onPress, disabled },
        React.createElement(Text, null, children)
      ),
  };
});

jest.mock('../../../src/components/Press', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, onPress, scale }: any) =>
      React.createElement(View, { onPress, testID: 'press' }, children),
  };
});

jest.mock('../../../src/components/Tok', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Tok: ({ who, size, ring, you }: any) =>
      React.createElement(View, { testID: `tok-${who?.initial || 'unknown'}` }),
  };
});

// Mock design tokens
jest.mock('../../../src/design/tokens', () => ({
  colors: {
    p1: '#FF8E7A',
    p2: '#9D95F5',
    p1Deep: '#FF6B4A',
    p2Deep: '#7D6FD5',
    ink: '#1a1a1a',
    inkSoft: '#666666',
    inkMute: '#999999',
    surface: '#F5F5F5',
    sunken: '#E0E0E0',
    line: '#D0D0D0',
  },
  gradients: {
    dawn: {
      colors: ['#FFF5E6', '#FFF0E6'],
      locations: [0, 1],
    },
  },
  radius: {
    pill: 100,
  },
  shadows: {
    shadow: { elevation: 3 },
    shadowSoft: { elevation: 2 },
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}));

// Mock typography
jest.mock('../../../src/design/typography', () => ({
  fontFamily: {
    ui: 'Hanken Grotesk',
    disp: 'Instrument Serif',
    mono: 'Space Mono',
  },
}));

// Mock constants
jest.mock('../../../src/features/onboarding/constants', () => ({
  INTENTS: [
    ['know', '🔍', 'Know each other more deeply'],
    ['talk', '💬', 'Spark better conversations'],
    ['rough', '🌧️', 'Navigate the hard moments'],
  ],
  MOMENTS: [
    ['morning', '☕', 'Morning coffee', '8:00 AM'],
    ['lunch', '🥪', 'Lunch break', '12:30 PM'],
    ['evening', '🌙', 'Evening wind-down', '8:00 PM'],
  ],
}));

// Mock UI store
let mockFireToast = jest.fn();
jest.mock('../../../src/store/ui', () => ({
  useUiStore: () => ({
    fireToast: mockFireToast,
    openSheet: jest.fn(),
    closeSheet: jest.fn(),
  }),
}));

// Mock auth hook
jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user-id' } },
    loading: false,
  }),
}));

// Mock couple hook
jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({
    couple: null,
    loading: false,
    status: 'none',
  }),
}));

// Mock pairing actions
let mockCreateCouple = jest.fn();
let mockJoinCouple = jest.fn();
jest.mock('../../../src/features/pairing/pairingActions', () => ({
  createCouple: () => mockCreateCouple(),
  joinCouple: (code: string) => mockJoinCouple(code),
}));

// Mock supabase
let mockSupabaseGetUser = jest.fn();
let mockSupabaseUpdate = jest.fn();
let mockSupabaseEq = jest.fn();

jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockSupabaseGetUser(),
    },
    from: (table: string) => ({
      update: (data: any) => {
        mockSupabaseUpdate(table, data);
        return {
          eq: (field: string, value: any) => mockSupabaseEq(field, value),
        };
      },
    }),
  },
}));

// Now import the component after mocks are set up
import OnboardingScreen from '../index';

describe('OnboardingScreen comprehensive test suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFireToast.mockClear();
    mockCreateCouple.mockClear();
    mockJoinCouple.mockClear();
    mockSupabaseGetUser.mockClear();
    mockSupabaseUpdate.mockClear();
    mockSupabaseEq.mockClear();
    mockReplace.mockClear();

    // Default mocks
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
    mockCreateCouple.mockResolvedValue({ invite_code: 'TEST-CODE' });
    mockJoinCouple.mockResolvedValue({ status: 'active' });
    mockSupabaseEq.mockResolvedValue({});
  });

  describe('Step 0: Welcome screen renders correctly', () => {
    it('should render wordmark component', () => {
      const { getByTestId } = render(<OnboardingScreen />);
      expect(getByTestId('wordmark')).toBeTruthy();
    });

    it('should display peek love avatar', () => {
      const { getByTestId } = render(<OnboardingScreen />);
      expect(getByTestId('peek-love')).toBeTruthy();
    });

    it('should navigate to step 1 on Get started', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);
      const button = getByTestId('btn-us');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Three taps, then the good part.')).toBeTruthy();
      });
    });
  });

  describe('Step 1: How it works renders correctly', () => {
    it('should display step content after navigation', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);
      const button = getByTestId('btn-us');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Three taps, then the good part.')).toBeTruthy();
      });
    });

    it('should show all three step rows', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);
      const button = getByTestId('btn-us');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Answer honestly')).toBeTruthy();
        expect(getByText('Call their answer')).toBeTruthy();
        expect(getByText('Come into focus')).toBeTruthy();
      });
    });
  });

  describe('Step 2: Intent multi-select', () => {
    it('should render intent selection screen', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('What do you two want?')).toBeTruthy();
      });
    });

    it('should have "know" pre-selected', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Know each other more deeply')).toBeTruthy();
        const continueBtn = getByTestId('btn-us');
        expect(continueBtn).not.toBeDisabled();
      });
    });

    it('should save intents to profile via supabase', async () => {
      const { getByTestId } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });

      const continueBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(continueBtn);
      });

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          'profiles',
          expect.objectContaining({ intents: expect.any(Array) })
        );
      });
    });

    it('should show error toast on supabase error', async () => {
      mockSupabaseUpdate.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { getByTestId } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });

      const continueBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(continueBtn);
      });

      await waitFor(() => {
        expect(mockFireToast).toHaveBeenCalledWith('Database error');
      });
    });
  });

  describe('Step 3: Couple creation and invite code display', () => {
    it('should render pair up screen', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('It takes two.')).toBeTruthy();
      });
    });

    it('should create couple and display invite code', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockCreateCouple).toHaveBeenCalled();
        expect(getByText('TEST-CODE')).toBeTruthy();
      });
    });

    it('should show error on couple creation failure', async () => {
      mockCreateCouple.mockRejectedValue(new Error('Creation failed'));

      const { getByTestId } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockFireToast).toHaveBeenCalledWith('Creation failed');
      });
    });
  });

  describe('Step 3: Code entry toggle and joinCouple flow', () => {
    it('should toggle between share and code entry modes', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Send Dani the link')).toBeTruthy();
        expect(getByText('Enter a code instead')).toBeTruthy();
      });
    });
  });

  describe('Step 4: Couple joined celebration', () => {
    it('should render celebration with emoji and avatars', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Send Dani the link')).toBeTruthy();
      });

      const shareBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(shareBtn);
      });

      await waitFor(() => {
        expect(getByText('Dani joined!')).toBeTruthy();
        expect(getByText('🎉')).toBeTruthy();
        expect(getByTestId('tok-Y')).toBeTruthy();
        expect(getByTestId('tok-D')).toBeTruthy();
      });
    });
  });

  describe('Step 5: Moment selection (single-select)', () => {
    it('should render all moment options', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Send Dani the link')).toBeTruthy();
      });

      const shareBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(shareBtn);
      });

      const almostBtn = getByTestId('btn-us');
      await waitFor(() => {
        almostBtn && expect(almostBtn).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(almostBtn);
      });

      await waitFor(() => {
        expect(getByText('Morning coffee')).toBeTruthy();
        expect(getByText('Lunch break')).toBeTruthy();
        expect(getByText('Evening wind-down')).toBeTruthy();
      });
    });

    it('should persist notify_time to profile', async () => {
      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Send Dani the link')).toBeTruthy();
      });

      const shareBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(shareBtn);
      });

      const almostBtn = getByTestId('btn-us');
      await waitFor(() => {
        almostBtn && expect(almostBtn).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(almostBtn);
      });

      await waitFor(() => {
        const finishBtn = getByText('Turn on daily nudge');
        expect(finishBtn).toBeTruthy();
      });

      const finishBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(finishBtn);
      });

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          'profiles',
          expect.objectContaining({ notify_time: expect.any(String) })
        );
      });
    });

    it('should show error on notify_time persistence failure', async () => {
      mockSupabaseUpdate.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const { getByTestId, getByText } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(getByText('Send Dani the link')).toBeTruthy();
      });

      const shareBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(shareBtn);
      });

      const almostBtn = getByTestId('btn-us');
      await waitFor(() => {
        almostBtn && expect(almostBtn).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(almostBtn);
      });

      await waitFor(() => {
        const finishBtn = getByText('Turn on daily nudge');
        expect(finishBtn).toBeTruthy();
      });

      const finishBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(finishBtn);
      });

      await waitFor(() => {
        expect(mockFireToast).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors without crashing', async () => {
      mockCreateCouple.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockFireToast).toHaveBeenCalledWith('Network error');
      });
    });

    it('should show error when not signed in', async () => {
      mockSupabaseGetUser.mockResolvedValue({ data: { user: null } });

      const { getByTestId } = render(<OnboardingScreen />);

      let button = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(button);
      });
      button = getByTestId('btn-ink');
      await act(async () => {
        fireEvent.press(button);
      });

      const continueBtn = getByTestId('btn-us');
      await act(async () => {
        fireEvent.press(continueBtn);
      });

      await waitFor(() => {
        expect(mockFireToast).toHaveBeenCalledWith('Not signed in');
      });
    });
  });
});
