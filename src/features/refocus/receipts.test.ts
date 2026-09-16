import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addReceipt,
  listReceipts,
  markCopied,
  markSent,
  purgeReceipts,
  saveDraft,
  loadDraft,
  clearDraft,
  toSnippet,
} from './receipts';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('receipts', () => {
  it('adds a read receipt with outcome and no sent stamp', async () => {
    const r = await addReceipt('He asked if I moved the money already', 'read', 'bridge');
    expect(r.kind).toBe('read');
    expect(r.outcome).toBe('bridge');
    expect(r.copied).toBe(false);
    expect(r.sentAt).toBeNull();

    const list = await listReceipts();
    expect(list).toHaveLength(1);
    expect(list[0].snippet).toBe('He asked if I moved the money already');
  });

  it('newest first', async () => {
    await addReceipt('first', 'saved');
    await addReceipt('second', 'read', 'no_bridge');
    const list = await listReceipts();
    expect(list.map((r) => r.snippet)).toEqual(['second', 'first']);
  });

  it('markCopied records copied WITHOUT marking sent (copied ≠ sent)', async () => {
    const r = await addReceipt('x', 'read', 'bridge');
    await markCopied(r.id);
    const [row] = await listReceipts();
    expect(row.copied).toBe(true);
    expect(row.sentAt).toBeNull();
  });

  it('markSent is the separate, manual act', async () => {
    const r = await addReceipt('x', 'read', 'bridge');
    await markSent(r.id);
    const [row] = await listReceipts();
    expect(typeof row.sentAt).toBe('string');
  });

  it('purge empties the list', async () => {
    await addReceipt('x', 'saved');
    await purgeReceipts();
    expect(await listReceipts()).toEqual([]);
  });
});

describe('draft', () => {
  it('round-trips and clears', async () => {
    await saveDraft('raw words before the call');
    expect(await loadDraft()).toBe('raw words before the call');
    await clearDraft();
    expect(await loadDraft()).toBe('');
  });

  it('saving an empty draft removes the stored one', async () => {
    await saveDraft('something');
    await saveDraft('   ');
    expect(await loadDraft()).toBe('');
  });
});

describe('toSnippet', () => {
  it('collapses whitespace and caps at 80 chars with an ellipsis', () => {
    expect(toSnippet('a  b\n c')).toBe('a b c');
    const long = 'word '.repeat(40);
    const snip = toSnippet(long);
    expect(snip.length).toBeLessThanOrEqual(80);
    expect(snip.endsWith('…')).toBe(true);
  });
});
