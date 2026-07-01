import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignupScreen from '../signup';

jest.mock('../../src/features/auth/authActions', () => ({
  signUpWithEmail: jest.fn(),
}));

import { signUpWithEmail } from '../../src/features/auth/authActions';

const mockSignUp = signUpWithEmail as jest.Mock;

// Controlled-input state only flushes inside an act() wrapper under
// React 19 + RN 0.85 + RNTL 14. fireEvent act-wraps itself, so calling it
// INSIDE act() nests two acts → "overlapping act() calls" (E2E finding F7);
// invoke the onChangeText props directly inside one act instead.
async function fillForm(
  screen: Awaited<ReturnType<typeof render>>,
  { name, email, password }: { name: string; email: string; password: string }
) {
  await act(async () => {
    screen.getByPlaceholderText('Yash').props.onChangeText(name);
    screen.getByPlaceholderText('you@example.com').props.onChangeText(email);
    screen.getByPlaceholderText('at least 6 characters').props.onChangeText(password);
  });
}

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create-account form', async () => {
    const { getByText, getByPlaceholderText } = await render(<SignupScreen />);

    expect(getByText('Create your account')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Create account')).toBeTruthy();
  });

  it('submits valid details and shows the check-your-inbox state', async () => {
    mockSignUp.mockResolvedValue(undefined);
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'yash@example.com',
      password: 'secret123',
    });
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('yash@example.com', 'secret123', 'Yash');
    });
    expect(await screen.findByText('Check your inbox')).toBeTruthy();
  });

  it('does not call signUp when the password is too short', async () => {
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'yash@example.com',
      password: '123',
    });
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});
