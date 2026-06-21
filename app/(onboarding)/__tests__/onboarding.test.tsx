import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../index';

// Mock dependencies BEFORE importing the component
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  };
});

jest.mock('../../../src/design/tokens', () => ({
  colors: {
    p2Deep: '#9d95f5',
    p2: '#9d95f5',
    p1: '#ff8e7a',
    p1Deep: '#ff8e7a',
    sunken: '#e8e4f0',
    surface: '#f5f3f8',
    line: '#e8e4f0',
    ink: '#1a1a1a',
    inkSoft: '#6b7280',
    inkMute: '#9ca3af',
  },
  gradients: {
    dawn: {
      colors: ['#f5f3f8', '#ffffff'],
      locations: [0, 1],
    },
  },
  radius: {
    pill: 999,
  },
  shadows: {
    shadow: { elevation: 5 },
    shadowSoft: { elevation: 2 },
  },
  space: {},
}));

jest.mock('../../../src/design/typography', () => ({
  fontFamily: {
    ui: 'System',
    disp: 'System',
    mono: 'monospace',
  },
}));

jest.mock('../../../src/components/Peek', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Peek: ({ size, mood }: any) => React.createElement(Text, {}, `Peek[${mood}]`),
  };
});

jest.mock('../../../src/components/Wordmark', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Wordmark: ({ size }: any) => React.createElement(Text, {}, 'Wordmark'),
  };
});

jest.mock('../../../src/components/Text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Serif: ({ children, s, c, italic, style }: any) =>
      React.createElement(Text, { style }, children),
    Kick: ({ children, c }: any) =>
      React.createElement(Text, {}, children),
  };
});

jest.mock('../../../src/components/Btn', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return function MockBtn({ children, onPress, disabled, kind, sub }: any) {
    return React.createElement(
      Pressable,
      { onPress, disabled },
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
  return function MockPress({ children, onPress, scale }: any) {
    return React.createElement(Pressable, { onPress }, children);
  };
});

jest.mock('../../../src/components/Tok', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Tok: ({ who, size, ring, you }: any) => React.createElement(Text, {}, 'Tok'),
  };
});

jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({
        data: {
          user: {
            id: 'test-user-id',
          },
        },
      })),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({})),
      })),
    })),
  },
}));

jest.mock('../../../src/features/auth/useSession', () => ({
  useSession: () => ({
    session: null,
    loading: false,
  }),
}));

jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({
    couple: null,
    loading: false,
    status: 'none',
  }),
}));

jest.mock('../../../src/features/pairing/pairingActions', () => ({
  createCouple: jest.fn(async () => ({
    id: 'couple-1',
    invite_code: 'YASH-4827',
    status: 'pending',
  })),
  joinCouple: jest.fn(async () => ({
    id: 'couple-1',
    invite_code: 'YASH-4827',
    status: 'active',
  })),
}));

jest.mock('../../../src/store/ui', () => ({
  useUiStore: () => ({
    fireToast: jest.fn(),
  }),
}));

// Mock Share separately without spreading react-native
jest.doMock('react-native', () => {
  const actual = jest.requireActual('react-native');
  actual.Share = {
    share: jest.fn(async () => ({})),
  };
  return actual;
}, { virtual: false });

describe('Onboarding', () => {
  // Constants tests
  it('onboarding constants INTENTS has 5 items', () => {
    const { INTENTS } = require('../../../src/features/onboarding/constants');
    expect(INTENTS).toHaveLength(5);
  });

  it('onboarding constants MOMENTS has 4 items', () => {
    const { MOMENTS } = require('../../../src/features/onboarding/constants');
    expect(MOMENTS).toHaveLength(4);
  });

  it('INTENTS contains all intent types', () => {
    const { INTENTS } = require('../../../src/features/onboarding/constants');
    const ids = INTENTS.map((i: any) => i[0]);
    expect(ids).toEqual(['know', 'talk', 'rough', 'far', 'fun']);
  });

  it('MOMENTS contains all moment types', () => {
    const { MOMENTS } = require('../../../src/features/onboarding/constants');
    const ids = MOMENTS.map((m: any) => m[0]);
    expect(ids).toEqual(['morning', 'lunch', 'evening', 'bed']);
  });

  // Component render tests
  it('Step 0 renders the tagline text "mind the parallax error"', async () => {
    const { getByText } = await render(<OnboardingScreen />);
    expect(getByText('mind the parallax error')).toBeTruthy();
  });

  it('pressing "Get started" advances to step 1 which shows "how it works"', async () => {
    const { getByText } = await render(<OnboardingScreen />);

    const getStartedBtn = getByText(/Get started/);
    expect(getStartedBtn).toBeTruthy();

    fireEvent.press(getStartedBtn);

    await waitFor(() => {
      expect(getByText(/Three taps, then the good part/i)).toBeTruthy();
    });
  });

  it('step 1 shows "Makes sense →" button that advances to step 2', async () => {
    const { getByText } = await render(<OnboardingScreen />);

    fireEvent.press(getByText(/Get started/));

    await waitFor(() => {
      expect(getByText(/Makes sense/i)).toBeTruthy();
    });

    const makesSenseBtn = getByText(/Makes sense/);
    fireEvent.press(makesSenseBtn);

    await waitFor(() => {
      expect(getByText(/What do you two want/i)).toBeTruthy();
    });
  });

  it('step 2 intent: continue button is present and enabled with pre-selected default', async () => {
    const { getByText } = await render(<OnboardingScreen />);

    // Navigate to step 2
    fireEvent.press(getByText(/Get started/));

    await waitFor(() => {
      expect(getByText(/Makes sense/i)).toBeTruthy();
    });

    fireEvent.press(getByText(/Makes sense/));

    await waitFor(() => {
      expect(getByText(/What do you two want/i)).toBeTruthy();
    });

    // Check that continue button exists and shows "1 selected" sub text (default intent is pre-selected)
    expect(getByText(/Continue/)).toBeTruthy();
    expect(getByText(/1 selected/i)).toBeTruthy();

    // Click another chip to toggle selection
    const talkChip = getByText(/Spark better conversations/i);
    fireEvent.press(talkChip);

    // Verify selection now shows "2 selected"
    await waitFor(() => {
      expect(getByText(/2 selected/i)).toBeTruthy();
    });
  });

  it('step 3 pair-up shows the invite code from mocked createCouple', async () => {
    const { getByText } = await render(<OnboardingScreen />);

    // Navigate to step 3 (through steps 0, 1, 2)
    fireEvent.press(getByText(/Get started/));

    await waitFor(() => {
      expect(getByText(/Makes sense/i)).toBeTruthy();
    });

    fireEvent.press(getByText(/Makes sense/));

    await waitFor(() => {
      expect(getByText(/What do you two want/i)).toBeTruthy();
    });

    // Continue should be enabled since 'know' is pre-selected
    const continueBtn = getByText(/Continue/);
    fireEvent.press(continueBtn);

    // Wait for the pair-up step with invite code to appear
    await waitFor(() => {
      expect(getByText(/YASH-4827/)).toBeTruthy();
    });
  });

  it('step 3 pair-up button text is "Send Dani the link"', async () => {
    const { getByText } = await render(<OnboardingScreen />);

    // Navigate to step 3
    fireEvent.press(getByText(/Get started/));

    await waitFor(() => {
      expect(getByText(/Makes sense/i)).toBeTruthy();
    });

    fireEvent.press(getByText(/Makes sense/));

    await waitFor(() => {
      expect(getByText(/What do you two want/i)).toBeTruthy();
    });

    const continueBtn = getByText(/Continue/);
    fireEvent.press(continueBtn);

    await waitFor(() => {
      expect(getByText(/Send Dani the link/i)).toBeTruthy();
    });
  });
});
