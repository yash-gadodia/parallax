import { computeWidgetSnapshot } from './snapshot';
import type { Couple, TodayState } from '../../types/db';

const couple: Couple = {
  id: 'c1',
  member_a: 'u1',
  member_b: 'u2',
  invite_code: 'ABC123',
  status: 'active',
  together_since: '2024-02-14',
  streak: 6,
  longest_streak: 11,
  freezes_remaining: 1,
  last_played_on: '2026-07-01',
  wavelength_avg: 74,
  plus: false,
  created_at: '2024-02-14T00:00:00Z',
};

const openToday = (over: Partial<TodayState> = {}): TodayState => ({
  exists: true,
  date: '2026-07-02',
  couple_drop_id: 'cd1',
  state: 'open',
  wave_pct: null,
  i_answered: false,
  partner_answered: false,
  ...over,
});

describe('computeWidgetSnapshot', () => {
  it('(a) partner answered, I have not -> guess (urgent)', () => {
    const snap = computeWidgetSnapshot(
      openToday({ state: 'one_done', partner_answered: true, i_answered: false }),
      couple,
      'Dani'
    );
    expect(snap).toEqual({
      state: 'guess',
      partnerName: 'Dani',
      wavePct: 0,
      streak: 6,
      date: '2026-07-02',
    });
  });

  it('(b) both done (revealed) -> synced with wave% + streak', () => {
    const snap = computeWidgetSnapshot(
      openToday({ state: 'revealed', wave_pct: 83, i_answered: true, partner_answered: true }),
      couple,
      'Dani'
    );
    expect(snap).toEqual({
      state: 'synced',
      partnerName: 'Dani',
      wavePct: 83,
      streak: 6,
      date: '2026-07-02',
    });
  });

  it('(b) rounds a fractional wave_pct and defaults a null one to 0', () => {
    expect(
      computeWidgetSnapshot(openToday({ state: 'revealed', wave_pct: 66.6 }), couple, 'Dani')
        .wavePct
    ).toBe(67);
    expect(
      computeWidgetSnapshot(openToday({ state: 'revealed', wave_pct: null }), couple, 'Dani')
        .wavePct
    ).toBe(0);
  });

  it('(c) neither answered -> waiting (teaser)', () => {
    const snap = computeWidgetSnapshot(openToday(), couple, 'Dani');
    expect(snap).toEqual({
      state: 'waiting',
      partnerName: 'Dani',
      wavePct: 0,
      streak: 6,
      date: '2026-07-02',
    });
  });

  it('(c) I answered but partner has not -> still waiting, never urgent', () => {
    const snap = computeWidgetSnapshot(
      openToday({ state: 'one_done', i_answered: true, partner_answered: false }),
      couple,
      'Dani'
    );
    expect(snap.state).toBe('waiting');
  });

  it('(d) no today state at all -> none fallback', () => {
    expect(computeWidgetSnapshot(null, null, 'Dani')).toEqual({
      state: 'none',
      partnerName: 'Dani',
      wavePct: 0,
      streak: 0,
      date: '',
    });
  });

  it('(d) today row does not exist yet -> none, keeps the date and streak', () => {
    const snap = computeWidgetSnapshot(
      { exists: false, date: '2026-07-02' },
      couple,
      'Dani'
    );
    expect(snap).toEqual({
      state: 'none',
      partnerName: 'Dani',
      wavePct: 0,
      streak: 6,
      date: '2026-07-02',
    });
  });
});
