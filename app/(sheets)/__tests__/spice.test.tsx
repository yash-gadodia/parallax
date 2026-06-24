import { render, fireEvent } from '@testing-library/react-native';
import SpiceSheet from '../spice';

const mockUpdateSpiceLevel = jest.fn(() => Promise.resolve());

jest.mock('../../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(() => ({
    spiceLevel: 'Flirty',
    updateSpiceLevel: mockUpdateSpiceLevel,
    name: 'Yash',
    partnerName: 'Dani',
    notifyTime: null,
    togetherSince: null,
    streak: 0,
    loading: false,
    updateProfile: jest.fn(),
  })),
}));

const { useProfile } = require('../../../src/features/profile/useProfile');

describe('SpiceSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useProfile.mockReturnValue({
      spiceLevel: 'Flirty',
      updateSpiceLevel: mockUpdateSpiceLevel,
      name: 'Yash',
      partnerName: 'Dani',
      notifyTime: null,
      togetherSince: null,
      streak: 0,
      loading: false,
      updateProfile: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the spice level options with descriptions', async () => {
    const { getByText } = await render(<SpiceSheet />);

    expect(getByText('spice level')).toBeDefined();
    expect(
      getByText('How bold should your daily questions get? You both see the same level, and you can change it anytime.')
    ).toBeDefined();

    expect(getByText('Sweet')).toBeDefined();
    expect(getByText('Flirty')).toBeDefined();
    expect(getByText('Spicy')).toBeDefined();

    expect(getByText('Wholesome, no spice. Cozy and kind.')).toBeDefined();
    expect(getByText('A little suggestive. Tasteful heat.')).toBeDefined();
    expect(getByText('Bolder, after-dark prompts. 18+')).toBeDefined();
  });

  it('calls updateSpiceLevel when a level is picked', async () => {
    const { getByText } = await render(<SpiceSheet />);
    fireEvent.press(getByText('Spicy'));
    expect(mockUpdateSpiceLevel).toHaveBeenCalledWith('Spicy');
  });

  it('initialises selection from profile spiceLevel', async () => {
    useProfile.mockReturnValue({
      spiceLevel: 'Sweet',
      updateSpiceLevel: mockUpdateSpiceLevel,
      name: 'Yash',
      partnerName: 'Dani',
      notifyTime: null,
      togetherSince: null,
      streak: 0,
      loading: false,
      updateProfile: jest.fn(),
    });
    const { getByText } = await render(<SpiceSheet />);
    expect(getByText('Sweet')).toBeDefined();
  });
});
