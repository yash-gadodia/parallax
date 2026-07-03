import { render, fireEvent } from '@testing-library/react-native';
import OnThisDayScreen from '../onThisDay';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), navigate: jest.fn() }),
}));

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));
jest.mock('../../src/features/history/useOnThisDay', () => ({
  useOnThisDay: jest.fn(),
}));

import { useIdentity } from '../../src/features/profile/useIdentity';
import { useOnThisDay } from '../../src/features/history/useOnThisDay';

const mockUseIdentity = useIdentity as jest.Mock;
const mockUseOnThisDay = useOnThisDay as jest.Mock;

const MEMORY = {
  date: '2026-06-28',
  code: 'W2',
  title: 'the deep end',
  wavelength: 92,
  twins_count: 2,
};

const PROMPTS = [
  { id: 'p1', emoji: '🍜', question: 'comfort food after a bad day?', options: ['ramen', 'pizza', 'ice cream'] },
  { id: 'p2', emoji: '🛋️', question: 'ideal friday night?', options: ['out out', 'couch fort'] },
];

// p1: twin (both ramen). p2: split — you couch fort, them out out.
const ANSWERS = [
  { youPick: 0, youHunch: 0, themPick: 0, themHunch: 0 },
  { youPick: 1, youHunch: 0, themPick: 0, themHunch: 1 },
];

describe('OnThisDayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
  });

  it('renders the seeded memory: date, title, wave and both partners answers', async () => {
    mockUseOnThisDay.mockReturnValue({
      memory: MEMORY,
      prompts: PROMPTS,
      answers: ANSWERS,
      loading: false,
    });

    const { getByText, getAllByText, queryByText } = await render(<OnThisDayScreen />);

    expect(getByText('remember this one?')).toBeTruthy();
    expect(getByText('june 28 · W2')).toBeTruthy();
    expect(getByText('the deep end')).toBeTruthy();
    // GradientText renders its string twice (mask + gradient fill).
    expect(getAllByText('92%')).toHaveLength(2);
    expect(getByText('in sync that day')).toBeTruthy();

    // The real prompts and the answers compare, per side.
    expect(getByText('comfort food after a bad day?')).toBeTruthy();
    expect(getAllByText('ramen')).toHaveLength(2); // twin moment: both picked it
    expect(getByText('ideal friday night?')).toBeTruthy();
    expect(getByText('couch fort')).toBeTruthy(); // you
    expect(getByText('out out')).toBeTruthy(); // Jordan
    expect(getAllByText('you')).toHaveLength(2);
    expect(getAllByText('Jordan')).toHaveLength(2);

    // A memory, not a report card — and no empty state.
    expect(queryByText('your story starts today')).toBeNull();
  });

  it('chains onward from a single memory to the whole story', async () => {
    mockUseOnThisDay.mockReturnValue({
      memory: MEMORY,
      prompts: PROMPTS,
      answers: ANSWERS,
      loading: false,
    });

    const { getByText } = await render(<OnThisDayScreen />);

    fireEvent.press(getByText('see your whole story →'));
    expect(mockPush).toHaveBeenCalledWith('/timeline');
  });

  it('shows the warm empty state when there is no revealed history', async () => {
    mockUseOnThisDay.mockReturnValue({
      memory: null,
      prompts: [],
      answers: [],
      loading: false,
    });

    const { getByText, queryByText } = await render(<OnThisDayScreen />);

    expect(getByText('your story starts today')).toBeTruthy();
    expect(
      getByText(
        "every reveal you two unlock becomes a memory here. play today's drop and this page starts filling up."
      )
    ).toBeTruthy();
    expect(getByText('back to today')).toBeTruthy();
    expect(queryByText('remember this one?')).toBeNull();
  });

  it('keeps the memory header honest while the answers are still loading', async () => {
    mockUseOnThisDay.mockReturnValue({
      memory: MEMORY,
      prompts: [],
      answers: [],
      loading: true,
    });

    const { getByText } = await render(<OnThisDayScreen />);

    expect(getByText('the deep end')).toBeTruthy();
    expect(getByText('finding your answers…')).toBeTruthy();
  });

  it('offers an honest retry when the answers fail to load, keeping the memory header', async () => {
    const refetch = jest.fn();
    mockUseOnThisDay.mockReturnValue({
      memory: MEMORY,
      prompts: [],
      answers: [],
      loading: false,
      error: new Error('offline'),
      refetch,
    });

    const { getByText, queryByText } = await render(<OnThisDayScreen />);

    expect(getByText('the deep end')).toBeTruthy();
    expect(
      getByText("couldn't load the answers right now — the memory is safe.")
    ).toBeTruthy();
    expect(queryByText('finding your answers…')).toBeNull();

    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
