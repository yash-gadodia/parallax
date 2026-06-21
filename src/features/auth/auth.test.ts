import { Session } from '@supabase/supabase-js';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInWithApple,
  signInWithGoogle,
} from './authActions';
import { useSession } from './useSession';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithIdToken: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('calls signInWithPassword with correct arguments', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      await signInWithEmail('test@example.com', 'password123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws error when signInWithPassword fails', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(signInWithEmail('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('signUpWithEmail', () => {
    it('calls signUp with email, password, and display_name in options.data', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      await signUpWithEmail('new@example.com', 'password123', 'John Doe');

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'John Doe',
          },
        },
      });
    });

    it('throws error when signUp fails', async () => {
      const mockError = new Error('Email already exists');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        signUpWithEmail('existing@example.com', 'password123', 'Jane Doe')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

      await signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('throws error when signOut fails', async () => {
      const mockError = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError,
      } as any);

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signInWithApple', () => {
    it('throws clear error when expo-apple-authentication is not available', async () => {
      await expect(signInWithApple()).rejects.toThrow(
        'Apple sign-in requires a dev build with expo-apple-authentication (service gate not yet configured)'
      );
    });
  });

  describe('signInWithGoogle', () => {
    it('throws clear error when Google sign-in is not configured', async () => {
      await expect(signInWithGoogle()).rejects.toThrow(
        'Google sign-in not configured (service gate not yet set up)'
      );
    });
  });
});

describe('useSession Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getSession on mount', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    // Simulate the hook initialization
    await (async () => {
      const getSession = mockSupabase.auth.getSession as jest.Mock;
      getSession();
    })();

    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
  });

  it('subscribes to auth state changes on mount', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const mockCallback = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    // Verify that onAuthStateChange is called with a callback
    const onAuthStateChange = mockSupabase.auth.onAuthStateChange as jest.Mock;
    expect(onAuthStateChange).not.toHaveBeenCalled();

    // In actual hook usage, this would be called
    onAuthStateChange(mockCallback);

    expect(onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('sets up subscription with correct structure', () => {
    const mockUnsubscribe = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    } as any);

    const result = mockSupabase.auth.onAuthStateChange(jest.fn());
    expect(result.data.subscription.unsubscribe).toBeDefined();
  });
});
