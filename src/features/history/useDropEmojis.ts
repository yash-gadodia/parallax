import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../auth/useSession';

// code -> emoji for real drops: the drop's first prompt's emoji is its face in
// lists (couple_history returns code/title but not emoji). No-op without a
// session (demo history comes from the static ARCHIVE, which carries its own).
export function useDropEmojis(codes: string[]): Record<string, string> {
  const { session } = useSession();
  const [emojis, setEmojis] = useState<Record<string, string>>({});
  // Effect keys on the joined string, not the array reference — callers pass a
  // fresh .map() array every render and must not re-trigger the fetch.
  const key = codes.join('\n');

  useEffect(() => {
    let cancelled = false;

    if (!session || key === '') {
      setEmojis({});
      return;
    }

    (async () => {
      const { data: drops, error } = await supabase
        .from('drops')
        .select('id, code')
        .in('code', key.split('\n'));
      if (cancelled || error || !drops) return;

      const dropRows = drops as Array<{ id: string; code: string | null }>;
      if (dropRows.length === 0) return;

      const { data: prompts, error: promptError } = await supabase
        .from('drop_prompts')
        .select('drop_id, emoji')
        .in('drop_id', dropRows.map((d) => d.id))
        .eq('position', 0);
      if (cancelled || promptError || !prompts) return;

      const promptRows = prompts as Array<{ drop_id: string; emoji: string | null }>;
      const emojiByDrop = new Map(promptRows.map((p) => [p.drop_id, p.emoji]));

      const next: Record<string, string> = {};
      for (const d of dropRows) {
        const emoji = emojiByDrop.get(d.id);
        if (d.code && emoji) next[d.code] = emoji;
      }
      setEmojis(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, key]);

  return emojis;
}
