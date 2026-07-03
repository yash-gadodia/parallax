import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { SAMPLE_JOURNEY } from './journeyLogic';

export interface JourneyListItem {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  tagline: string | null;
  description: string | null;
  stageCount: number;
}

interface UseJourneysReturn {
  journeys: JourneyListItem[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * The journeys catalog (global, RLS-readable to any authenticated user).
 * No session/couple → the sample journey (isSample), so the demo browses a
 * faithful preview and never fakes server data. A real couple with a fetch
 * failure gets an honest error + retry, never the sample.
 */
export function useJourneys(): UseJourneysReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [journeys, setJourneys] = useState<JourneyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isSample = !session || !couple;

  useEffect(() => {
    let cancelled = false;

    const fetchJourneys = async () => {
      if (isSample) {
        setJourneys([
          {
            id: SAMPLE_JOURNEY.id,
            slug: SAMPLE_JOURNEY.slug,
            title: SAMPLE_JOURNEY.title,
            emoji: SAMPLE_JOURNEY.emoji,
            tagline: SAMPLE_JOURNEY.tagline,
            description: SAMPLE_JOURNEY.description,
            stageCount: SAMPLE_JOURNEY.stageCount,
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('journeys')
          .select('id, slug, title, emoji, tagline, description')
          .eq('active', true)
          .order('created_at', { ascending: true });
        if (cancelled) return;
        if (fetchError) throw fetchError;

        const rows = (data || []) as Array<
          Omit<JourneyListItem, 'stageCount'>
        >;

        const { data: stages, error: stagesError } = await supabase
          .from('journey_stages')
          .select('journey_id')
          .in('journey_id', rows.map((r) => r.id));
        if (cancelled) return;
        if (stagesError) throw stagesError;

        const counts = new Map<string, number>();
        for (const s of (stages || []) as Array<{ journey_id: string }>) {
          counts.set(s.journey_id, (counts.get(s.journey_id) ?? 0) + 1);
        }

        setJourneys(
          rows.map((r) => ({ ...r, stageCount: counts.get(r.id) ?? 0 }))
        );
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch journeys'));
        setJourneys([]);
        setLoading(false);
      }
    };

    fetchJourneys();

    return () => {
      cancelled = true;
    };
  }, [isSample, reloadKey]);

  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { journeys, loading: loading || coupleLoading, isSample, error, refetch };
}
