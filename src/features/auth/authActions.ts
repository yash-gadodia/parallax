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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WebBrowser = require('expo-web-browser');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Linking = require('expo-linking');

  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start Google sign-in');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  // User backed out of the browser — not an error.
  if (result.type === 'cancel' || result.type === 'dismiss') return;
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in failed');
  }

  // PKCE: the redirect carries ?code=… → exchange it for a session.
  const parsed = Linking.parse(result.url);
  const code = parsed.queryParams?.code;
  if (typeof code === 'string') {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }

  // Fallback for implicit flow (#access_token=…&refresh_token=…).
  const hash = result.url.includes('#') ? result.url.split('#')[1] : '';
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (sessionError) throw sessionError;
    return;
  }

  throw new Error('Google sign-in returned no session');
}
