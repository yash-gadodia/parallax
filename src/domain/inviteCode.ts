export function isValidInviteCode(code: string): boolean {
  const validFormat = /^[A-Z0-9]{4}-[0-9]{4}$/;
  return validFormat.test(code);
}

export function normalizeInviteCode(input: string): string {
  const alnumOnly = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (alnumOnly.length === 0) {
    return '-';
  }

  if (alnumOnly.length >= 8) {
    return `${alnumOnly.slice(0, 4)}-${alnumOnly.slice(4, 8)}`;
  }

  // Fewer than 8: insert dash after 4th char if we have 4+, otherwise after what we have
  if (alnumOnly.length < 4) {
    return `${alnumOnly}-`;
  }

  return `${alnumOnly.slice(0, 4)}-${alnumOnly.slice(4)}`;
}

export function formatInviteCode(raw: string): string {
  const upper = raw.toUpperCase();

  if (upper.length >= 8) {
    return `${upper.slice(0, 4)}-${upper.slice(4, 8)}`;
  }

  // Fewer than 8 chars: insert dash after 4th (or use what we have)
  if (upper.length <= 4) {
    return `${upper}-`;
  }

  return `${upper.slice(0, 4)}-${upper.slice(4)}`;
}

// Parses a parallax://join?code=XXXX-1234 deep-link URL and returns the
// normalized, validated invite code, or null if the URL is invalid/missing.
export function extractInviteCodeFromLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (!code) return null;
    const normalized = normalizeInviteCode(code);
    return isValidInviteCode(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
