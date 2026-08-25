import { render } from '@testing-library/react-native';
import MemoryScreen from '../us';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: () => {},
}));

jest.mock('../../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../../src/features/lovemap/useLearnings', () => ({
  useLearnings: jest.fn(),
}));
jest.mock('../../../src/features/refocus/useRefocusRecord', () => ({
  useRefocusRecord: jest.fn(),
}));

import { useCouple } from '../../../src/features/pairing/useCouple';
import { useLearnings } from '../../../src/features/lovemap/useLearnings';
import { useRefocusRecord } from '../../../src/features/refocus/useRefocusRecord';

const mockUseCouple = useCouple as jest.Mock;
const mockUseLearnings = useLearnings as jest.Mock;
const mockUseRecord = useRefocusRecord as jest.Mock;

const RESOLVED = {
  id: 's1',
  topic: 'the dishes thing',
  state: 'revealed',
  summary: 'They needed a walk before talking numbers.',
  themes: ['chores', 'timing'],
  created_at: '2026-08-01T10:00:00Z',
};

beforeEach(() => {
  mockPush.mockClear();
  mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, status: 'active' });
  mockUseLearnings.mockReturnValue({ items: [], isSample: false });
  mockUseRecord.mockReturnValue({ sessions: [], loading: false });
});

describe('Memory (v2)', () => {
  it('offers a warm empty state rather than a blank screen', async () => {
    const { getByText } = await render(<MemoryScreen />);

    expect(getByText(/Your first repair\s+starts the record/)).toBeTruthy();
  });

  it('shows a resolved session by its summary and themes', async () => {
    mockUseRecord.mockReturnValue({ sessions: [RESOLVED], loading: false });

    const { getByText, queryByText } = await render(<MemoryScreen />);

    expect(getByText('the dishes thing')).toBeTruthy();
    expect(getByText('They needed a walk before talking numbers.')).toBeTruthy();
    expect(getByText('chores')).toBeTruthy();
    expect(queryByText(/Your first repair/)).toBeNull();
  });

  it('never renders an expired session as part of the record', async () => {
    mockUseRecord.mockReturnValue({
      sessions: [{ ...RESOLVED, id: 's2', state: 'expired', topic: 'never finished' }],
      loading: false,
    });

    const { queryByText } = await render(<MemoryScreen />);

    expect(queryByText('never finished')).toBeNull();
  });

  it('falls back gracefully when a session has no summary yet', async () => {
    mockUseRecord.mockReturnValue({
      sessions: [{ ...RESOLVED, summary: null, themes: null }],
      loading: false,
    });

    const { getByText } = await render(<MemoryScreen />);

    expect(getByText('You found the middle ground on this one.')).toBeTruthy();
  });

  it('lists what the couple now knows', async () => {
    mockUseLearnings.mockReturnValue({
      items: [{ id: 'l1', emoji: '🚶', need: 'space before money talks' }],
      isSample: false,
    });

    const { getByText } = await render(<MemoryScreen />);

    expect(getByText('space before money talks')).toBeTruthy();
  });

  // Presenting the demo seed as this couple's own history is the exact failure
  // documented in REVAMP_CLARITY_PASS.md.
  it('never presents sample learnings as the couple’s own', async () => {
    mockUseLearnings.mockReturnValue({
      items: [{ id: 'l1', emoji: '🚶', need: 'sample seed row' }],
      isSample: true,
    });

    const { queryByText, getByText } = await render(<MemoryScreen />);

    expect(queryByText('sample seed row')).toBeNull();
    expect(getByText(/Your first repair\s+starts the record/)).toBeTruthy();
  });
});
