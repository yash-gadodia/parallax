import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface RepairStatRow {
  revealed_at: string | null;
  mutual_yes: boolean;
}

/**
 * Revealed repair check-ins for the growth story (F5). RLS already limits
 * reads to couple members and reveals expose both verdicts, so a plain
 * select is safe here. A mutual "yes" is a repair.
 */
export function useRepairStats(coupleId: string | null) {
  const [repairs, setRepairs] = useState<RepairStatRow[]>([]);

  useEffect(() => {
    if (!coupleId) {
      setRepairs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('repair_checkins')
          .select('initiator_verdict, partner_verdict, revealed_at, state')
          .eq('couple_id', coupleId)
          .eq('state', 'revealed');
        if (cancelled || error || !data) return;
        // supabase-js typed select infers never (known quirk, database.md)
        const rows = data as ReadonlyArray<{
          initiator_verdict: string | null;
          partner_verdict: string | null;
          revealed_at: string | null;
        }>;
        setRepairs(
          rows.map((r) => ({
            revealed_at: r.revealed_at,
            mutual_yes: r.initiator_verdict === 'yes' && r.partner_verdict === 'yes',
          }))
        );
      } catch {
        // offline — growth story just shows the always-positive default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleId]);

  return { repairs };
}
