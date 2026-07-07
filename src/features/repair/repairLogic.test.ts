import { parseRepairCheckin, repairOutcome, repairCardView } from './repairLogic';
import type { RepairCheckinState } from './repairLogic';

describe('parseRepairCheckin', () => {
  it('parses a full open projection', () => {
    const parsed = parseRepairCheckin({
      exists: true,
      id: 'ck-1',
      state: 'open',
      i_answered: false,
      partner_answered: false,
    });
    expect(parsed).toEqual({
      exists: true,
      id: 'ck-1',
      state: 'open',
      i_answered: false,
      partner_answered: false,
    });
  });

  it('parses exists=false without requiring other fields', () => {
    expect(parseRepairCheckin({ exists: false })).toEqual({ exists: false });
  });

  it('rejects junk shapes', () => {
    expect(parseRepairCheckin(null)).toBeNull();
    expect(parseRepairCheckin({})).toBeNull();
    expect(parseRepairCheckin({ exists: true })).toBeNull();
    expect(parseRepairCheckin({ exists: true, id: 'x', state: 'still_open' })).toBeNull();
  });
});

describe('repairOutcome', () => {
  it('mutual yes is a repair', () => {
    expect(repairOutcome('yes', 'yes')).toBe('repair');
  });

  it('either still_tender leads with tenderness', () => {
    expect(repairOutcome('still_tender', 'yes')).toBe('tender');
    expect(repairOutcome('yes', 'still_tender')).toBe('tender');
    expect(repairOutcome('still_tender', 'still_tender')).toBe('tender');
    expect(repairOutcome('getting_there', 'still_tender')).toBe('tender');
  });

  it('everything else is getting there', () => {
    expect(repairOutcome('getting_there', 'getting_there')).toBe('getting_there');
    expect(repairOutcome('yes', 'getting_there')).toBe('getting_there');
    expect(repairOutcome('getting_there', 'yes')).toBe('getting_there');
  });
});

describe('repairCardView', () => {
  const open: RepairCheckinState = {
    exists: true,
    id: 'ck-1',
    state: 'open',
    i_answered: false,
    partner_answered: false,
  };
  const base = {
    flagOn: true,
    isLive: true,
    checkin: open,
    revealSeen: false,
    reflectionSaved: false,
  };

  it('is hidden with the flag off, in demo mode, or with no check-in', () => {
    expect(repairCardView({ ...base, flagOn: false })).toEqual({ kind: 'hidden' });
    expect(repairCardView({ ...base, isLive: false })).toEqual({ kind: 'hidden' });
    expect(repairCardView({ ...base, checkin: null })).toEqual({ kind: 'hidden' });
    expect(repairCardView({ ...base, checkin: { exists: false } })).toEqual({ kind: 'hidden' });
  });

  it('asks the question until I answer, then waits', () => {
    expect(repairCardView({ ...base })).toEqual({ kind: 'question' });
    expect(
      repairCardView({ ...base, checkin: { ...open, i_answered: true, my_verdict: 'yes' } })
    ).toEqual({ kind: 'waiting' });
  });

  it('reveals with the outcome once revealed and unseen', () => {
    expect(
      repairCardView({
        ...base,
        checkin: {
          ...open,
          state: 'revealed',
          i_answered: true,
          partner_answered: true,
          my_verdict: 'yes',
          their_verdict: 'yes',
        },
      })
    ).toEqual({ kind: 'reveal', outcome: 'repair', mine: 'yes', theirs: 'yes' });
  });

  it('a seen reveal leaves quietly', () => {
    expect(
      repairCardView({
        ...base,
        revealSeen: true,
        checkin: {
          ...open,
          state: 'revealed',
          my_verdict: 'yes',
          their_verdict: 'yes',
        },
      })
    ).toEqual({ kind: 'hidden' });
  });

  it('the 48h reflection belongs only to the partner who answered', () => {
    expect(
      repairCardView({
        ...base,
        checkin: { ...open, state: 'reflection', reflection_mine: true },
      })
    ).toEqual({ kind: 'reflection' });
    expect(
      repairCardView({
        ...base,
        checkin: { ...open, state: 'reflection', reflection_mine: false },
      })
    ).toEqual({ kind: 'hidden' });
  });

  it('a saved reflection leaves quietly', () => {
    expect(
      repairCardView({
        ...base,
        reflectionSaved: true,
        checkin: { ...open, state: 'reflection', reflection_mine: true },
      })
    ).toEqual({ kind: 'hidden' });
  });
});
