import { supabase } from '../../lib/supabase';

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function signInWithApple(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AppleAuth = require('expo-apple-authentication');

    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token received from Apple');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('identityToken')) {
      throw err;
    }
    throw new Error(
      'Apple sign-in requires a dev build with expo-apple-authentication (service gate not yet configured)'
    );
  }
}

export async function signInWithGoogle(): Promise<void> {
  throw new Error(
    'Google sign-in not configured (service gate not yet set up)'
  );
}
