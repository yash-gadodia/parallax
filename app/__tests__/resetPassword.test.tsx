import { render, fireEvent, act } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../src/features/auth/authActions', () => ({
  updatePassword: jest.fn(),
}));

// The real ui store's toast timer (1.9s) outlives the test worker; mock it.
const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: () => ({ toast: null, fireToast: mockFireToast }),
}));

import ResetPasswordScreen from '../resetPassword';
import { updatePassword } from '../../src/features/auth/authActions';

const mockUpdatePassword = updatePassword as jest.Mock;

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the set-new-password form', async () => {
    const { getByText, getByPlaceholderText } = await render(<ResetPasswordScreen />);

    expect(getByText('Set a new password')).toBeTruthy();
    expect(getByPlaceholderText('at least 6 characters')).toBeTruthy();
    expect(getByText('Save new password')).toBeTruthy();
  });

  it('does not call updatePassword when the password is too short', async () => {
    const screen = await render(<ResetPasswordScreen />);

    await act(async () => {
      screen.getByPlaceholderText('at least 6 characters').props.onChangeText('123');
    });
    await fireEvent.press(screen.getByText('Save new password'));

    expect(mockUpdatePassword).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('saves a valid password and routes home', async () => {
    mockUpdatePassword.mockResolvedValue(undefined);
    const screen = await render(<ResetPasswordScreen />);

    await act(async () => {
      screen.getByPlaceholderText('at least 6 characters').props.onChangeText('newpass123');
    });
    await fireEvent.press(screen.getByText('Save new password'));

    expect(mockUpdatePassword).toHaveBeenCalledWith('newpass123');
    expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
    expect(mockFireToast).toHaveBeenCalledWith('Password updated');
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('stays on the screen and does not navigate when the update fails', async () => {
    mockUpdatePassword.mockRejectedValue(new Error('session missing'));
    const screen = await render(<ResetPasswordScreen />);

    await act(async () => {
      screen.getByPlaceholderText('at least 6 characters').props.onChangeText('newpass123');
    });
    await fireEvent.press(screen.getByText('Save new password'));

    expect(mockUpdatePassword).toHaveBeenCalledWith('newpass123');
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
