import {
  buildTimeline,
  milestonesFromActivity,
  monthYearLabel,
  MilestoneEntry,
  TimelineEntry,
} from './timeline';
import type { Activity } from '../../types/db';

const drop = (
  date: string,
  code: string,
  title: string,
  wavelength: number,
  twins_count: number,
  couple_drop_id = ''
) => ({ date, code, title, wavelength, twins_count, couple_drop_id });

// A compact shape of the feed for exact ordering assertions.
const shape = (entries: TimelineEntry[]) =>
  entries.map((e) => (e.kind === 'month' ? `month:${e.label}` : `${e.kind}:${e.id}`));

describe('monthYearLabel', () => {
  it('formats a year-month into an uppercase Kick header', () => {
    expect(monthYearLabel('2026-07')).toBe('JULY 2026');
    expect(monthYearLabel('2026-06')).toBe('JUNE 2026');
    expect(monthYearLabel('2024-01')).toBe('JANUARY 2024');
    expect(monthYearLabel('2025-12')).toBe('DECEMBER 2025');
  });
});

describe('milestonesFromActivity', () => {
  const act = (id: string, kind: string, payload: unknown, created_at: string): Activity => ({
    id,
    couple_id: 'c1',
    kind,
    actor: null,
    payload,
    read_by: [],
    created_at,
  });

  it('keeps only milestone rows with a numeric payload.days, dated by created_at', () => {
    const out = milestonesFromActivity([
      act('a1', 'played', {}, '2026-07-03T10:00:00.000Z'),
      act('a2', 'milestone', { days: 7 }, '2026-07-03T10:05:00.000Z'),
      act('a3', 'nudge', { days: 3 }, '2026-07-02T09:00:00.000Z'),
      act('a4', 'milestone', {}, '2026-07-01T09:00:00.000Z'),
      act('a5', 'milestone', { days: 30 }, '2026-06-20T09:00:00.000Z'),
    ]);

    expect(out).toEqual<MilestoneEntry[]>([
      { kind: 'milestone', id: 'milestone-a2', date: '2026-07-03', days: 7 },
      { kind: 'milestone', id: 'milestone-a5', date: '2026-06-20', days: 30 },
    ]);
  });
});

describe('buildTimeline', () => {
  it('merges drops, milestones and the pair-up into one reverse-chron feed with month headers', () => {
    const entries = buildTimeline({
      history: [
        drop('2026-07-02', 'DROP 27', 'the ick list', 88, 2, 'cd-27'),
        drop('2026-06-30', 'DROP 26', 'future tense', 74, 1, 'cd-26'),
      ],
      milestones: [{ kind: 'milestone', id: 'milestone-m1', date: '2026-07-01', days: 7 }],
      pairup: { date: '2026-06-15', label: 'Yash & Dani paired up' },
    });

    expect(shape(entries)).toEqual([
      'month:JULY 2026',
      'drop:drop-cd-27',
      'milestone:milestone-m1',
      'month:JUNE 2026',
      'drop:drop-cd-26',
      'pairup:pairup',
    ]);
  });

  it('opens a fresh month header at every year-month boundary', () => {
    const entries = buildTimeline({
      history: [
        drop('2026-07-01', 'D3', 'c', 60, 0, 'cd-3'),
        drop('2026-06-28', 'D2', 'b', 70, 0, 'cd-2'),
        drop('2026-05-10', 'D1', 'a', 50, 0, 'cd-1'),
      ],
      milestones: [],
      pairup: null,
    });

    expect(shape(entries)).toEqual([
      'month:JULY 2026',
      'drop:drop-cd-3',
      'month:JUNE 2026',
      'drop:drop-cd-2',
      'month:MAY 2026',
      'drop:drop-cd-1',
    ]);
  });

  it('flags twins_count >= 2 as a twin day and leaves 0/1 untouched', () => {
    const entries = buildTimeline({
      history: [
        drop('2026-07-03', 'D3', 'two twins', 90, 2, 'cd-3'),
        drop('2026-07-02', 'D2', 'one twin', 80, 1, 'cd-2'),
        drop('2026-07-01', 'D1', 'no twins', 70, 0, 'cd-1'),
      ],
      milestones: [],
      pairup: null,
    });

    const drops = entries.filter((e) => e.kind === 'drop');
    expect(drops.map((e) => (e.kind === 'drop' ? e.twin : null))).toEqual([true, false, false]);
  });

  it('orders a same-day milestone above its drop above the pair-up', () => {
    const entries = buildTimeline({
      history: [drop('2024-02-01', 'D1', 'first drop', 65, 3, 'cd-1')],
      milestones: [{ kind: 'milestone', id: 'milestone-m1', date: '2024-02-01', days: 3 }],
      pairup: { date: '2024-02-01', label: 'Yash & Dani paired up' },
    });

    expect(shape(entries)).toEqual([
      'month:FEBRUARY 2024',
      'milestone:milestone-m1',
      'drop:drop-cd-1',
      'pairup:pairup',
    ]);
  });

  it('returns an empty feed for no sources', () => {
    expect(buildTimeline({ history: [], milestones: [], pairup: null })).toEqual([]);
  });

  it('places the pair-up last as the oldest moment across months', () => {
    const entries = buildTimeline({
      history: [drop('2026-07-02', 'D1', 'a', 80, 0, 'cd-1')],
      milestones: [],
      pairup: { date: '2023-11-20', label: 'Alex & Jordan paired up' },
    });

    expect(shape(entries)).toEqual([
      'month:JULY 2026',
      'drop:drop-cd-1',
      'month:NOVEMBER 2023',
      'pairup:pairup',
    ]);
  });
});
