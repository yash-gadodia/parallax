import { render, fireEvent } from '@testing-library/react-native';
import ScienceScreen from '../science';
import { safeBack } from '../../src/lib/nav';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockSafeBack = safeBack as jest.Mock;

describe('ScienceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading and all six grounding cards', async () => {
    const { getByText } = await render(<ScienceScreen />);

    expect(getByText('why parallax works')).toBeTruthy();
    expect(getByText('The daily questions')).toBeTruthy();
    expect(getByText('The hunch')).toBeTruthy();
    expect(getByText('Twin moments')).toBeTruthy();
    expect(getByText('One small ritual a day')).toBeTruthy();
    expect(getByText('The misses are the conversation')).toBeTruthy();
    expect(getByText('No score on your relationship')).toBeTruthy();
  });

  it('frames the never-grade principle honestly (no fabricated score claim)', async () => {
    const { getByText } = await render(<ScienceScreen />);
    expect(
      getByText(/scores the guess, never the bond/)
    ).toBeTruthy();
  });

  it('the back button navigates home via safeBack', async () => {
    const { getByTestId } = await render(<ScienceScreen />);
    fireEvent.press(getByTestId('topbar-back'));
    expect(mockSafeBack).toHaveBeenCalledTimes(1);
  });
});
