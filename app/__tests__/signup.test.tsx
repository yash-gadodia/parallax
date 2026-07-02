import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignupScreen from '../signup';

jest.mock('../../src/features/auth/authActions', () => ({
  signUpWithEmail: jest.fn(),
  resendConfirmationEmail: jest.fn(),
  isValidEmail: jest.requireActual('../../src/features/auth/authActions').isValidEmail,
  humanAuthError: jest.requireActual('../../src/features/auth/authActions').humanAuthError,
}));

import { signUpWithEmail, resendConfirmationEmail } from '../../src/features/auth/authActions';

const mockSignUp = signUpWithEmail as jest.Mock;
const mockResend = resendConfirmationEmail as jest.Mock;

// The real ui store's toast timer (1.9s) outlives the test worker; mock it.
const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: () => ({ toast: null, fireToast: mockFireToast }),
}));

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
    await fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('yash@example.com', 'secret123', 'Yash');
    });
    expect(await screen.findByText('Check your inbox')).toBeTruthy();
  });

  it('rejects an invalid email with an inline error and never calls signUp', async () => {
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'not-an-email',
      password: 'secret123',
    });
    await fireEvent.press(screen.getByText('Create account'));

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('clears the inline email error once the email is edited', async () => {
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'bad',
      password: 'secret123',
    });
    await fireEvent.press(screen.getByText('Create account'));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();

    await act(async () => {
      screen.getByPlaceholderText('you@example.com').props.onChangeText('yash@example.com');
    });

    expect(screen.queryByText('Enter a valid email address')).toBeNull();
  });

  it('resends the confirmation email from the check-your-inbox state and starts a 30s cooldown', async () => {
    mockSignUp.mockResolvedValue(undefined);
    mockResend.mockResolvedValue(undefined);
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'yash@example.com',
      password: 'secret123',
    });
    await fireEvent.press(screen.getByText('Create account'));
    expect(screen.getByText("Didn't get it? Resend email")).toBeTruthy();

    await fireEvent.press(screen.getByText("Didn't get it? Resend email"));
    expect(mockResend).toHaveBeenCalledWith('yash@example.com');
    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockFireToast).toHaveBeenCalledWith('Confirmation email re-sent');
    expect(screen.getByText('Resend in 30s')).toBeTruthy();
    expect(screen.queryByText("Didn't get it? Resend email")).toBeNull();
  });

  it('does not call signUp when the password is too short', async () => {
    const screen = await render(<SignupScreen />);

    await fillForm(screen, {
      name: 'Yash',
      email: 'yash@example.com',
      password: '123',
    });
    await fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});
