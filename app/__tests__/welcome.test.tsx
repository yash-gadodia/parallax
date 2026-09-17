import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Welcome from '../welcome';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

beforeEach(() => mockPush.mockClear());

// The whole first run for a one-person app: say what it is, then let them in.
// It must never mention pairing, invite codes, or a partner's account.
describe('Welcome (One Side first run)', () => {
  it('explains the app before asking for anything', async () => {
    const { getByText } = await render(<Welcome />);
    expect(getByText('One side of the story. Yours.')).toBeTruthy();
    expect(getByText(/rereading the chat/)).toBeTruthy();
    expect(getByText(/one sentence worth sending/i)).toBeTruthy();
  });

  it('promises the partner never gets an account or a link', async () => {
    const { getByText } = await render(<Welcome />);
    expect(getByText(/never gets an account, a link, or a screen/)).toBeTruthy();
  });

  it('offers exactly two ways in: start, or sign in', async () => {
    const { getByTestId } = await render(<Welcome />);

    fireEvent.press(getByTestId('welcome-start'));
    expect(mockPush).toHaveBeenCalledWith('/signup');

    fireEvent.press(getByTestId('welcome-signin'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('never mentions pairing, invites or the couples game', async () => {
    const { queryByText } = await render(<Welcome />);
    expect(queryByText(/invite/i)).toBeNull();
    expect(queryByText(/pair/i)).toBeNull();
    expect(queryByText(/this is the game/i)).toBeNull();
  });
});
