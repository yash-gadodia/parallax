import AsyncStorage from '@react-native-async-storage/async-storage';

// Receipts: the paired-run test's instrument (PRD §4.4 / §7), local-first.
// "Sent" is a manual, deliberate act the user records in Receipts. It is
// NEVER stamped on Copy, and nothing here arms the couples repair check-in
// (the review's top blocker: mark_bridge_sent pings the partner).
//
// The draft store is the Working/Retry guarantee: the raw entry is written
// BEFORE the model call, so a failure can never lose what was written.

export interface Receipt {
  id: string;
  at: string; // ISO
  snippet: string;
  kind: 'saved' | 'read';
  outcome: 'bridge' | 'no_bridge' | 'safety' | null;
  copied: boolean;
  sentAt: string | null;
}

const KEY = 'oneside.receipts.v1';
const DRAFT_KEY = 'oneside.draft.v1';
const MAX = 200;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toSnippet(text: string): string {
  const line = text.trim().replace(/\s+/g, ' ');
  return line.length <= 80 ? line : `${line.slice(0, 79).trimEnd()}…`;
}

export async function listReceipts(): Promise<Receipt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Receipt[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write(list: Receipt[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export async function addReceipt(
  text: string,
  kind: Receipt['kind'],
  outcome: Receipt['outcome'] = null
): Promise<Receipt> {
  const receipt: Receipt = {
    id: makeId(),
    at: new Date().toISOString(),
    snippet: toSnippet(text),
    kind,
    outcome,
    copied: false,
    sentAt: null,
  };
  const list = await listReceipts();
  await write([receipt, ...list]);
  return receipt;
}

async function update(
  id: string,
  patch: Partial<Receipt>
): Promise<void> {
  const list = await listReceipts();
  await write(list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

/** Copy is recorded as copied, nothing more. Copied-but-not-sent is a fail
 * the test must be able to see (PRD §7). */
export async function markCopied(id: string): Promise<void> {
  await update(id, { copied: true });
}

/** The user's own deliberate "I sent it" tap in Receipts. */
export async function markSent(id: string): Promise<void> {
  await update(id, { sentAt: new Date().toISOString() });
}

export async function purgeReceipts(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// ── Draft (written before every model call; cleared on success) ────────────

export async function saveDraft(text: string): Promise<void> {
  try {
    if (text.trim()) await AsyncStorage.setItem(DRAFT_KEY, text);
    else await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    // storage failure must never block capture
  }
}

export async function loadDraft(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(DRAFT_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
}
