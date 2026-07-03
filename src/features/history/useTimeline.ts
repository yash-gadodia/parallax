import { useCallback, useMemo } from 'react';
import { useCouple } from '../pairing/useCouple';
import { useCoupleHistory } from '../lovemap/useCoupleHistory';
import { useActivity } from '../engagement/useActivity';
import { useProfile } from '../profile/useProfile';
import {
  buildTimeline,
  milestonesFromActivity,
  MilestoneEntry,
  TimelineEntry,
} from './timeline';

interface UseTimelineReturn {
  entries: TimelineEntry[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
  refetch: () => void;
}

// Composes the sources we already have — couple_history (drops), the activity
// feed (streak milestones) and the couple's start — into one reverse-chron feed.
// No new RPC, no new table; RLS gates every read as-is.
export function useTimeline(): UseTimelineReturn {
  const { couple, loading: coupleLoading } = useCouple();
  const {
    history,
    loading: historyLoading,
    isSample,
    error: historyError,
    refetch: refetchHistory,
  } = useCoupleHistory();
  const {
    items: activityItems,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useActivity(couple?.id ?? null);
  const { name, partnerName } = useProfile();

  const entries = useMemo(() => {
    const pairupLabel = `${name} & ${partnerName} paired up`;

    if (isSample) {
      // Unauthenticated demo: build from the same ARCHIVE-backed sample history
      // useCoupleHistory returns, plus a demo pair-up and one demo milestone so
      // the preview shows every entry shape. Stays clearly sample.
      const sampleDate = history[0]?.date ?? new Date().toISOString().slice(0, 10);
      const milestones: MilestoneEntry[] = [
        { kind: 'milestone', id: 'milestone-sample', date: sampleDate, days: 7 },
      ];
      return buildTimeline({
        history,
        milestones,
        pairup: { date: '2024-02-01', label: pairupLabel },
      });
    }

    const milestones = milestonesFromActivity(activityItems);
    const start = (couple?.together_since ?? couple?.created_at ?? '').slice(0, 10);
    return buildTimeline({
      history,
      milestones,
      pairup: start ? { date: start, label: pairupLabel } : null,
    });
  }, [isSample, history, activityItems, couple, name, partnerName]);

  const loading = coupleLoading || historyLoading || (!isSample && activityLoading);
  // Drops are the spine of the story — a milestone-feed hiccup degrades
  // gracefully (milestones just absent). Only a history failure is fatal.
  const error = historyError;

  const refetch = useCallback(() => {
    refetchHistory();
    refetchActivity();
  }, [refetchHistory, refetchActivity]);

  return { entries, loading, isSample, error, refetch };
}
