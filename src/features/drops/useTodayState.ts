import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ensureTodayDrop, getDropContent, getTodayState } from './dropActions';
import type { DropContent } from './dropActions';
import type { TodayState } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel.
let todayChannelSeq = 0;

// ---------------------------------------------------------------------------
// Pure "today" helpers (RN-free, exact-testable). The screen injects a clock
// (now: () => Date) so tests never depend on the real wall clock.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Whole device-local days since the couple was created. The day the couple is
 * created is day 0; the next local day is day 1, and so on. Null/invalid
 * created_at reads as 0 (a brand-new couple), never NaN.
 */
export function coupleAgeDays(createdAt: string | null | undefined, now: Date): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.max(0, Math.round((startOfLocalDay(now) - startOfLocalDay(created)) / DAY_MS));
}

/** Evening = 19:00 or later, device-local. */
export function isEvening(now: Date): boolean {
  return now.getHours() >= 19;
}

/** 'YYYY-MM-DD' for the device-local day — the one-per-day dedupe key. */
export function localDayKey(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/**
 * The scripted first-week beat for Today (IMPROVEMENT_PLAN 2.3):
 * - days 2–6 with a streak of 2+ → 'pulse' (the streak pill gently pulses)
 * - day 7 with a streak of 7 or more → 'week' (the one-week banner → /wrapped)
 * - anything else → null (no beat; day 1 gets the streak-rule line instead)
 */
export function firstWeekBeat(ageDays: number, streak: number): 'pulse' | 'week' | null {
  if (ageDays === 7 && streak >= 7) return 'week';
  if (ageDays >= 2 && ageDays <= 6 && streak >= 2) return 'pulse';
  return null;
}

/**
 * Server-rehydrated "today" for the couple: did I answer, did my partner,
 * is the reveal ready, what's the stored wavelength — plus the actual content
 * assigned to today's drop (rotation-aware, migration 0015). If no couple_drop
 * exists yet, it's created (ensure_today_drop is idempotent) so Today always
 * shows the REAL assigned drop, never the static demo content.
 * Live-updates via realtime on couple_drops so the partner's submit flips the
 * UI immediately. Null coupleId (demo / unpaired) returns nulls.
 */
export function useTodayState(coupleId: string | null) {
  const [today, setToday] = useState<TodayState | null>(null);
  const [content, setContent] = useState<DropContent | null>(null);
  const [loading, setLoading] = useState(!!coupleId);

  const refresh = useCallback(async () => {
    if (!coupleId) return;
    let state = await getTodayState(coupleId);
    if (state && !state.exists) {
      try {
        await ensureTodayDrop(coupleId);
        state = await getTodayState(coupleId);
      } catch {
        // Offline / transient failure: keep the honest not-loaded state.
      }
    }
    setToday(state);
    if (state?.couple_drop_id) {
      setContent(await getDropContent(state.couple_drop_id));
    }
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) {
      setToday(null);
      setContent(null);
      setLoading(false);
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes
    // a second channel with the same topic.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      await refresh();
      if (cancelled) return;

      channel = supabase
        .channel(`today-state-${coupleId}-${++todayChannelSeq}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'couple_drops',
            filter: `couple_id=eq.${coupleId}`,
          },
          () => {
            refresh();
          }
        );
      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [coupleId, refresh]);

  return { today, content, loading, refresh };
}
