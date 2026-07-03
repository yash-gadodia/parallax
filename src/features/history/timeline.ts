import type { Activity, CoupleHistoryRow } from '../../types/db';

// Pure, RN-free builders for the couple's timeline ("your story"): merge the
// real moments we already have (revealed drops, streak milestones, the pair-up)
// into one reverse-chronological feed with month separators. Exact-tested.

export interface DropEntry {
  kind: 'drop';
  id: string;
  date: string;
  code: string;
  title: string;
  wavelength: number;
  twins_count: number;
  couple_drop_id: string;
  // twins_count >= 2 earns the day its 👯 treatment in the feed.
  twin: boolean;
}

export interface MilestoneEntry {
  kind: 'milestone';
  id: string;
  date: string;
  days: number;
}

export interface PairupEntry {
  kind: 'pairup';
  id: string;
  date: string;
  label: string;
}

export interface MonthEntry {
  kind: 'month';
  id: string;
  ym: string;
  label: string;
}

export type TimelineEntry = DropEntry | MilestoneEntry | PairupEntry | MonthEntry;

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

// '2026-07' -> 'JULY 2026'. Parses the parts directly (no TZ drift).
export function monthYearLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// Pull the real streak-milestone moments out of the raw activity feed. Only the
// 'milestone' kind (0017/0022 producer) with a numeric payload.days counts —
// anything else is ignored, so the timeline never invents a moment.
export function milestonesFromActivity(activities: Activity[]): MilestoneEntry[] {
  const out: MilestoneEntry[] = [];
  for (const a of activities) {
    if (a.kind !== 'milestone') continue;
    const payload = a.payload as { days?: unknown } | null;
    const days = payload && typeof payload.days === 'number' ? payload.days : null;
    if (days === null) continue;
    out.push({
      kind: 'milestone',
      id: `milestone-${a.id}`,
      date: a.created_at.slice(0, 10),
      days,
    });
  }
  return out;
}

export interface TimelineSources {
  history: Array<
    Pick<CoupleHistoryRow, 'date' | 'code' | 'title' | 'wavelength' | 'twins_count'> & {
      couple_drop_id?: string;
    }
  >;
  milestones: MilestoneEntry[];
  pairup: { date: string; label: string } | null;
}

// Merge + sort (newest first) + month-bucket. Within one day: milestone above
// drop above the pair-up; ties break on id for determinism. Month headers are
// emitted before the first entry of each new year-month.
export function buildTimeline(sources: TimelineSources): TimelineEntry[] {
  const dated: Array<{
    rank: number;
    entry: DropEntry | MilestoneEntry | PairupEntry;
  }> = [];

  for (const h of sources.history) {
    const cdid = h.couple_drop_id ?? '';
    dated.push({
      rank: 2,
      entry: {
        kind: 'drop',
        id: `drop-${cdid || `${h.code}-${h.date}`}`,
        date: h.date,
        code: h.code,
        title: h.title,
        wavelength: h.wavelength,
        twins_count: h.twins_count,
        couple_drop_id: cdid,
        twin: (h.twins_count ?? 0) >= 2,
      },
    });
  }

  for (const m of sources.milestones) {
    dated.push({ rank: 3, entry: m });
  }

  if (sources.pairup) {
    dated.push({
      rank: 1,
      entry: {
        kind: 'pairup',
        id: 'pairup',
        date: sources.pairup.date,
        label: sources.pairup.label,
      },
    });
  }

  dated.sort((a, b) => {
    if (a.entry.date !== b.entry.date) return a.entry.date < b.entry.date ? 1 : -1;
    if (a.rank !== b.rank) return b.rank - a.rank;
    return a.entry.id < b.entry.id ? 1 : a.entry.id > b.entry.id ? -1 : 0;
  });

  const out: TimelineEntry[] = [];
  let currentYm: string | null = null;
  for (const { entry } of dated) {
    const ym = entry.date.slice(0, 7);
    if (ym !== currentYm) {
      currentYm = ym;
      out.push({ kind: 'month', id: `month-${ym}`, ym, label: monthYearLabel(ym) });
    }
    out.push(entry);
  }

  return out;
}
