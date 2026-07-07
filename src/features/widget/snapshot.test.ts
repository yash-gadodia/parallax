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
  tz: 'Asia/Singapore',
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

// Injected clocks around the 20:00 streak-risk boundary (device-local).
const MORNING = new Date(2026, 6, 2, 10, 0, 0);
const ONE_TO_EIGHT = new Date(2026, 6, 2, 19, 59, 59);
const EIGHT_SHARP = new Date(2026, 6, 2, 20, 0, 0);
const LATE = new Date(2026, 6, 2, 22, 30, 0);

describe('computeWidgetSnapshot', () => {
  it('(a) partner answered, I have not -> guess (urgent)', () => {
    const snap = computeWidgetSnapshot(
      openToday({ state: 'one_done', partner_answered: true, i_answered: false }),
      couple,
      'Dani',
      MORNING
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
      'Dani',
      MORNING
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
      computeWidgetSnapshot(openToday({ state: 'revealed', wave_pct: 66.6 }), couple, 'Dani', MORNING)
        .wavePct
    ).toBe(67);
    expect(
      computeWidgetSnapshot(openToday({ state: 'revealed', wave_pct: null }), couple, 'Dani', MORNING)
        .wavePct
    ).toBe(0);
  });

  it('(c) neither answered -> waiting (teaser)', () => {
    const snap = computeWidgetSnapshot(openToday(), couple, 'Dani', MORNING);
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
      'Dani',
      MORNING
    );
    expect(snap.state).toBe('waiting');
  });

  it('(d) no today state at all -> none fallback', () => {
    expect(computeWidgetSnapshot(null, null, 'Dani', MORNING)).toEqual({
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
      'Dani',
      MORNING
    );
    expect(snap).toEqual({
      state: 'none',
      partnerName: 'Dani',
      wavePct: 0,
      streak: 6,
      date: '2026-07-02',
    });
  });

  describe('(e) streak-at-risk after 20:00', () => {
    it('flips to risk at exactly 20:00 when the streak is alive and today is unrevealed', () => {
      const snap = computeWidgetSnapshot(openToday(), couple, 'Dani', EIGHT_SHARP);
      expect(snap).toEqual({
        state: 'risk',
        partnerName: 'Dani',
        wavePct: 0,
        streak: 6,
        date: '2026-07-02',
      });
    });

    it('stays waiting at 19:59:59 — the boundary is 20:00, not evening-ish', () => {
      expect(computeWidgetSnapshot(openToday(), couple, 'Dani', ONE_TO_EIGHT).state).toBe(
        'waiting'
      );
    });

    it('stays guess at 19:59:59 when the ball is in my court', () => {
      expect(
        computeWidgetSnapshot(
          openToday({ state: 'one_done', partner_answered: true, i_answered: false }),
          couple,
          'Dani',
          ONE_TO_EIGHT
        ).state
      ).toBe('guess');
    });

    it('risk outranks guess: partner answered + I have not + 20:00 -> risk', () => {
      expect(
        computeWidgetSnapshot(
          openToday({ state: 'one_done', partner_answered: true, i_answered: false }),
          couple,
          'Dani',
          EIGHT_SHARP
        ).state
      ).toBe('risk');
    });

    it('risk even when I already played — the streak still dies at midnight', () => {
      expect(
        computeWidgetSnapshot(
          openToday({ state: 'one_done', i_answered: true, partner_answered: false }),
          couple,
          'Dani',
          LATE
        ).state
      ).toBe('risk');
    });

    it('synced outranks risk: a revealed drop late at night is celebratory, not scary', () => {
      expect(
        computeWidgetSnapshot(
          openToday({ state: 'revealed', wave_pct: 83, i_answered: true, partner_answered: true }),
          couple,
          'Dani',
          LATE
        ).state
      ).toBe('synced');
    });

    it('no risk without a streak to lose (streak 0 stays waiting at 22:30)', () => {
      expect(
        computeWidgetSnapshot(openToday(), { ...couple, streak: 0 }, 'Dani', LATE).state
      ).toBe('waiting');
    });

    it('no risk without a today row (none still wins at 22:30)', () => {
      expect(
        computeWidgetSnapshot({ exists: false, date: '2026-07-02' }, couple, 'Dani', LATE).state
      ).toBe('none');
    });
  });
});
