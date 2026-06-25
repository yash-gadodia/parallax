import { render } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));

import { useCouple } from '../../src/features/pairing/useCouple';

const mockUseCouple = useCouple as jest.Mock;

describe('Today Screen', () => {
  beforeEach(() => {
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });
  });

  it('renders the daily drop and the play CTA', async () => {
    const { getByText } = await render(<TodayScreen />);
    expect(getByText('soft launch')).toBeTruthy();
    expect(getByText("Play today's three")).toBeTruthy();
  });

  it('shows the invite-ahead banner (not a partner-played ping) while pairing is pending', async () => {
    mockUseCouple.mockReturnValue({
      couple: { id: 'c1', status: 'pending', invite_code: 'ABCD-1234', streak: 0 },
      status: 'pending',
      loading: false,
    });

    const { getByText, queryByText } = await render(<TodayScreen />);

    expect(getByText('Invite your partner to pair')).toBeTruthy();
    expect(getByText("answer ahead · they'll see it when they join")).toBeTruthy();
    // The fake "partner already played" ping must NOT show when there is no partner.
    expect(queryByText('Dani already played today')).toBeNull();
    // They can still answer their own half ahead of time.
    expect(getByText("Play today's three")).toBeTruthy();
  });
});
