/**
 * Feature flags (V2 eng gate §11.6): OTA-toggleable kill switches read from
 * the feature_flags table. The contract under test:
 *   - every flag defaults OFF (false) before and without a successful fetch
 *   - loadFlags() applies server rows exactly (enabled true → on)
 *   - a fetch error keeps every flag OFF (fail-safe, never fail-open)
 *   - unknown server keys are ignored
 *   - concurrent loadFlags() calls share one fetch
 */

const mockSelect = jest.fn();
jest.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: (...args: unknown[]) => mockSelect(table, ...args),
    }),
  },
}));

import { FLAGS, isFlagOn, loadFlags, __resetFlagsForTest } from './flags';

beforeEach(() => {
  __resetFlagsForTest();
  mockSelect.mockReset();
});

describe('FLAGS registry', () => {
  it('contains exactly the five V2 kill switches from eng gate §11.6', () => {
    expect(Object.values(FLAGS).sort()).toEqual([
      'f1_mood_check',
      'f1_partner_notify',
      'f2_repair_checkin',
      'f3_weave',
      'f5_growth_counter',
    ]);
  });
});

describe('isFlagOn defaults', () => {
  it('returns false for every flag before any load', () => {
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
    expect(isFlagOn(FLAGS.F1_PARTNER_NOTIFY)).toBe(false);
    expect(isFlagOn(FLAGS.F2_REPAIR_CHECKIN)).toBe(false);
    expect(isFlagOn(FLAGS.F3_WEAVE)).toBe(false);
    expect(isFlagOn(FLAGS.F5_GROWTH_COUNTER)).toBe(false);
  });
});

describe('loadFlags', () => {
  it('applies fetched rows exactly', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { key: 'f1_mood_check', enabled: true },
        { key: 'f2_repair_checkin', enabled: false },
      ],
      error: null,
    });
    await loadFlags();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(true);
    expect(isFlagOn(FLAGS.F2_REPAIR_CHECKIN)).toBe(false);
    expect(isFlagOn(FLAGS.F3_WEAVE)).toBe(false);
  });

  it('keeps every flag OFF when the fetch errors', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await loadFlags();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
    expect(isFlagOn(FLAGS.F5_GROWTH_COUNTER)).toBe(false);
  });

  it('keeps every flag OFF when the fetch throws (offline)', async () => {
    mockSelect.mockRejectedValue(new Error('network down'));
    await loadFlags();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
  });

  it('ignores unknown keys from the server', async () => {
    mockSelect.mockResolvedValue({
      data: [{ key: 'f9_not_a_flag', enabled: true }],
      error: null,
    });
    await loadFlags();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
    expect(isFlagOn(FLAGS.F3_WEAVE)).toBe(false);
  });

  it('shares one fetch across concurrent calls', async () => {
    mockSelect.mockResolvedValue({
      data: [{ key: 'f1_mood_check', enabled: true }],
      error: null,
    });
    await Promise.all([loadFlags(), loadFlags(), loadFlags()]);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(true);
  });

  it('refetches after a reset (fresh session)', async () => {
    mockSelect.mockResolvedValue({
      data: [{ key: 'f1_mood_check', enabled: true }],
      error: null,
    });
    await loadFlags();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(true);
    __resetFlagsForTest();
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
    mockSelect.mockResolvedValue({ data: [], error: null });
    await loadFlags();
    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(isFlagOn(FLAGS.F1_MOOD_CHECK)).toBe(false);
  });
});
