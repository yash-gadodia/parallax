import {
  parseTalkPrompts,
  stageProgressLabel,
  progressFraction,
  canAdvance,
  checkinStatusLine,
  SAMPLE_JOURNEY,
  SAMPLE_JOURNEY_STATE,
} from './journeyLogic';
import type { JourneyState } from '../../types/db';

const baseState: JourneyState = {
  exists: true,
  couple_journey_id: 'cj1',
  journey_id: 'j1',
  slug: 'bto',
  title: 'the bto journey',
  emoji: '🏠',
  stage_count: 7,
  current_stage: 3,
  started_at: '2026-01-01T00:00:00Z',
  completed_at: null,
  i_checked_in: false,
  partner_checked_in: false,
  stages: [],
};

describe('parseTalkPrompts', () => {
  it('parses well-formed {emoji, text} entries exactly', () => {
    const parsed = parseTalkPrompts([
      { emoji: '🗺', text: 'which estates are on our list' },
      { emoji: '⏳', text: 'how many rounds can we take' },
    ]);
    expect(parsed).toEqual([
      { emoji: '🗺', text: 'which estates are on our list' },
      { emoji: '⏳', text: 'how many rounds can we take' },
    ]);
  });

  it('drops malformed entries and keeps the good ones', () => {
    const parsed = parseTalkPrompts([
      { emoji: '🗺', text: 'keep me' },
      { emoji: '💥' },
      { text: 'no emoji' },
      { emoji: '🫥', text: '' },
      'not an object',
      null,
    ]);
    expect(parsed).toEqual([{ emoji: '🗺', text: 'keep me' }]);
  });

  it('returns [] for non-array input', () => {
    expect(parseTalkPrompts(null)).toEqual([]);
    expect(parseTalkPrompts('[]')).toEqual([]);
    expect(parseTalkPrompts({ emoji: '🗺', text: 'x' })).toEqual([]);
  });
});

describe('stageProgressLabel', () => {
  it('labels a walking journey by stage', () => {
    expect(stageProgressLabel(1, 7, false)).toBe('stage 1 of 7');
    expect(stageProgressLabel(4, 7, false)).toBe('stage 4 of 7');
  });

  it('labels a finished journey complete', () => {
    expect(stageProgressLabel(7, 7, true)).toBe('complete');
  });
});

describe('progressFraction', () => {
  it('is 0 at stage 1 — nothing behind you yet', () => {
    expect(progressFraction(1, 7, false)).toBe(0);
  });

  it('counts completed stages exactly', () => {
    expect(progressFraction(4, 7, false)).toBe(3 / 7);
    expect(progressFraction(7, 7, false)).toBe(6 / 7);
  });

  it('is exactly 1 on completion', () => {
    expect(progressFraction(7, 7, true)).toBe(1);
  });

  it('never divides by zero or goes negative', () => {
    expect(progressFraction(1, 0, false)).toBe(0);
    expect(progressFraction(0, 7, false)).toBe(0);
  });
});

describe('canAdvance', () => {
  it('is false while nobody has checked in', () => {
    expect(canAdvance(baseState)).toBe(false);
  });

  it('is true when I checked in', () => {
    expect(canAdvance({ ...baseState, i_checked_in: true })).toBe(true);
  });

  it('is true when only my partner checked in — a quiet partner never dead-ends us', () => {
    expect(canAdvance({ ...baseState, partner_checked_in: true })).toBe(true);
  });

  it('is false after completion and for missing/unenrolled state', () => {
    expect(
      canAdvance({ ...baseState, i_checked_in: true, completed_at: '2026-06-01T00:00:00Z' })
    ).toBe(false);
    expect(canAdvance(null)).toBe(false);
    expect(canAdvance({ exists: false })).toBe(false);
  });
});

describe('checkinStatusLine', () => {
  it('is null while nobody has checked in', () => {
    expect(checkinStatusLine(baseState, 'Dani')).toBeNull();
    expect(checkinStatusLine(null, 'Dani')).toBeNull();
  });

  it('names each check-in combination exactly', () => {
    expect(checkinStatusLine({ ...baseState, i_checked_in: true }, 'Dani')).toBe(
      'you checked in ✓ · Dani can add theirs anytime'
    );
    expect(checkinStatusLine({ ...baseState, partner_checked_in: true }, 'Dani')).toBe(
      'Dani checked in ✓ · add yours, or move on together'
    );
    expect(
      checkinStatusLine({ ...baseState, i_checked_in: true, partner_checked_in: true }, 'Dani')
    ).toBe('you both checked in ✓');
  });
});

describe('SAMPLE_JOURNEY (the demo preview mirrors the seeded catalog shape)', () => {
  it('has 7 stages in dense order', () => {
    expect(SAMPLE_JOURNEY.stageCount).toBe(7);
    expect(SAMPLE_JOURNEY.stages.map((s) => s.position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('every stage carries talk prompts and a check-in question', () => {
    for (const stage of SAMPLE_JOURNEY.stages) {
      expect(stage.talk_prompts.length).toBeGreaterThanOrEqual(3);
      expect(stage.checkin_prompt.length).toBeGreaterThan(0);
      expect(stage.title.length).toBeGreaterThan(0);
    }
  });

  it('the sample state sits mid-journey at stage 3 with the partner checked in', () => {
    expect(SAMPLE_JOURNEY_STATE.current_stage).toBe(3);
    expect(SAMPLE_JOURNEY_STATE.stage_count).toBe(7);
    expect(SAMPLE_JOURNEY_STATE.partner_checked_in).toBe(true);
    expect(SAMPLE_JOURNEY_STATE.i_checked_in).toBe(false);
  });
});
