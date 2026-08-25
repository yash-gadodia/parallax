import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../(tabs)/today';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: () => {},
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../src/features/auth/useSession', () => ({
  useSession: jest.fn(),
}));
jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));
jest.mock('../../src/features/lovemap/useLearnings', () => ({
  useLearnings: jest.fn(),
}));
jest.mock('../../src/features/refocus/useRefocusSession', () => ({
  useRefocusSession: jest.fn(),
}));
// The two cards own their own server state and are covered by their own
// suites; here we only care that Home renders them.
jest.mock('../../src/features/mood/MoodCheckCard', () => ({
  MoodCheckCard: () => null,
}));
jest.mock('../../src/features/repair/RepairCheckinCard', () => ({
  RepairCheckinCard: () => null,
}));

import { useCouple } from '../../src/features/pairing/useCouple';
import { useSession } from '../../src/features/auth/useSession';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useLearnings } from '../../src/features/lovemap/useLearnings';
import { useRefocusSession } from '../../src/features/refocus/useRefocusSession';

const mockUseCouple = useCouple as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseIdentity = useIdentity as jest.Mock;
const mockUseLearnings = useLearnings as jest.Mock;
const mockUseRefocusSession = useRefocusSession as jest.Mock;

const MY_ID = 'me-1';
const THEIR_ID = 'them-1';

beforeEach(() => {
  mockPush.mockClear();
  mockUseSession.mockReturnValue({ session: { user: { id: MY_ID } } });
  mockUseCouple.mockReturnValue({
    couple: { id: 'c1', tz: 'Asia/Singapore' },
    status: 'active',
  });
  mockUseIdentity.mockReturnValue({
    me: { name: 'You', initial: 'Y' },
    partner: { name: 'Dani', initial: 'D', hasPartner: true },
    loading: false,
  });
  mockUseLearnings.mockReturnValue({ items: [], isSample: false });
  mockUseRefocusSession.mockReturnValue({ session: null, refresh: jest.fn() });
});

describe('Home (v2)', () => {
  it('leads with the mediator, not a daily game', async () => {
    const { getByText, queryByText } = await render(<HomeScreen />);

    expect(getByText("Something's up?")).toBeTruthy();
    expect(getByText('Untangle something')).toBeTruthy();
    // The v1 drop loop is gone from this screen.
    expect(queryByText(/Play today's three/i)).toBeNull();
  });

  it('opens Refocus from the primary action', async () => {
    const { getByText } = await render(<HomeScreen />);

    fireEvent.press(getByText('Untangle something'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/refocus');
  });

  it('surfaces a live session your partner opened, in their words not yours', async () => {
    mockUseRefocusSession.mockReturnValue({
      session: { id: 's1', state: 'waiting_partner', initiator: THEIR_ID },
      refresh: jest.fn(),
    });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Dani shared their side')).toBeTruthy();
    expect(getByText('they opened one')).toBeTruthy();
  });

  it('shows your own waiting session differently', async () => {
    mockUseRefocusSession.mockReturnValue({
      session: { id: 's1', state: 'waiting_partner', initiator: MY_ID },
      refresh: jest.fn(),
    });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Your side is in')).toBeTruthy();
    expect(getByText('in progress')).toBeTruthy();
  });

  it('has no session card when nothing is open', async () => {
    const { queryByText } = await render(<HomeScreen />);

    expect(queryByText('in progress')).toBeNull();
    expect(queryByText('they opened one')).toBeNull();
  });

  it('nudges an unpaired user to bring their partner in', async () => {
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, status: 'pending' });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Bring Dani in')).toBeTruthy();
  });

  it('does not nag a paired couple to pair', async () => {
    const { queryByText } = await render(<HomeScreen />);

    expect(queryByText('Bring Dani in')).toBeNull();
  });

  it('teases the couple memory with the latest learning', async () => {
    mockUseLearnings.mockReturnValue({
      items: [{ emoji: '🚶', need: 'a walk before money talks' }],
      isSample: false,
    });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('🚶 a walk before money talks')).toBeTruthy();
  });
});
