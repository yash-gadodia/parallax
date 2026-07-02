import React from 'react';
import { render } from '@testing-library/react-native';
import ShareSheet from '../share';
import { useIdentity } from '../../../src/features/profile/useIdentity';

jest.mock('../../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));

const mockUseIdentity = useIdentity as jest.Mock;

describe('ShareSheet', () => {
  beforeEach(() => {
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
  });

  it('renders the share sheet with title and content', async () => {
    const { getByText } = await render(<ShareSheet />);

    // Assert the sheet title is rendered
    expect(getByText('share via')).toBeTruthy();

    // Assert the "on the same wavelength" text is rendered
    expect(getByText('on the same wavelength')).toBeTruthy();

    // Assert the share buttons are rendered
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Instagram')).toBeTruthy();
    expect(getByText('Copy')).toBeTruthy();
  });

  it('renders the real couple names in the share-card footer', async () => {
    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('Alex & Jordan · TODAY')).toBeTruthy();
    expect(queryByText(/YASH & DANI/)).toBeNull();
  });

  it('drops the names from the footer when there is no partner yet', async () => {
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'your partner', initial: '·', hasPartner: false },
      loading: false,
    });

    const { getByText, queryByText } = await render(<ShareSheet />);

    expect(getByText('TODAY')).toBeTruthy();
    expect(queryByText(/&/)).toBeNull();
  });
});
