import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UsePackSamplesReturn {
  samples: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// A pack's honest preview: the first catalog drop of its theme (rotation
// order), its 3 real questions. No local stub strings.
export function usePackSamples(theme: string | null): UsePackSamplesReturn {
  const [samples, setSamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!theme) {
      setSamples([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSamples = async () => {
      try {
        const { data: drops, error: dropsError } = await supabase
          .from('drops')
          .select('id')
          .eq('theme', theme)
          .order('position', { ascending: true })
          .limit(1);
        if (cancelled) return;
        if (dropsError) throw dropsError;

        const dropRows = (drops || []) as Array<{ id: string }>;
        const dropId = dropRows[0]?.id;
        if (!dropId) {
          setSamples([]);
          setError(null);
          setLoading(false);
          return;
        }

        const { data: prompts, error: promptsError } = await supabase
          .from('drop_prompts')
          .select('question')
          .eq('drop_id', dropId)
          .order('position', { ascending: true })
          .limit(3);
        if (cancelled) return;
        if (promptsError) throw promptsError;

        const promptRows = (prompts || []) as Array<{ question: string | null }>;
        setSamples(
          promptRows
            .map((p) => p.question)
            .filter((q): q is string => typeof q === 'string' && q.length > 0)
        );
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err
            : new Error((err as { message?: string })?.message || 'Failed to fetch pack samples')
        );
        setLoading(false);
      }
    };

    fetchSamples();

    return () => {
      cancelled = true;
    };
  }, [theme, reloadKey]);

  const refetch = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return { samples, loading, error, refetch };
}
