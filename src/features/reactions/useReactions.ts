import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Reaction } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel
// (same idiom as useDropState).
let reactionChannelSeq = 0;

/** The tap-once palette on the reveal's compare cards. */
export const REACTION_EMOJIS = ['🥹', '😂', '❤️', '👀'] as const;

interface ReactionsState {
  reactions: Reaction[];
  myId: string | null;
  loading: boolean;
  error: Error | null;
}

// Replace any existing reaction by the same author on the same prompt —
// mirrors the server's unique(couple_drop_id, prompt_id, author).
function mergeReaction(list: Reaction[], row: Reaction): Reaction[] {
  return [
    ...list.filter((r) => !(r.prompt_id === row.prompt_id && r.author === row.author)),
    row,
  ];
}

/**
 * Live reactions for one couple_drop: initial fetch + realtime subscription,
 * plus `react()` — the tap-once upsert (RLS only allows it post-reveal).
 */
export function useReactions(coupleDropId: string | null): ReactionsState & {
  react: (promptId: string, emoji: string) => Promise<void>;
} {
  const [state, setState] = useState<ReactionsState>({
    reactions: [],
    myId: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!coupleDropId) {
      setState({ reactions: [], myId: null, loading: false, error: null });
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes
    // a second channel with the same topic.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const myId = userData?.user?.id ?? null;

        const { data, error } = await supabase
          .from('reactions')
          .select('id, couple_drop_id, prompt_id, author, emoji, created_at')
          .eq('couple_drop_id', coupleDropId);

        if (cancelled) return;
        if (error) throw error;

        setState({
          reactions: (data || []) as Reaction[],
          myId,
          loading: false,
          error: null,
        });

        if (!cancelled) {
          channel = supabase
            .channel(`reactions-${coupleDropId}-${++reactionChannelSeq}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'reactions',
                filter: `couple_drop_id=eq.${coupleDropId}`,
              },
              (payload) => {
                const row = payload.new as Reaction | null;
                if (row && row.prompt_id && row.author) {
                  setState((prev) => ({
                    ...prev,
                    reactions: mergeReaction(prev.reactions, row),
                  }));
                }
              }
            );
          channel.subscribe();
        }
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error'),
        }));
      }
    };

    load();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [coupleDropId]);

  const react = useCallback(
    async (promptId: string, emoji: string) => {
      if (!coupleDropId) return;
      const { data: userData } = await supabase.auth.getUser();
      const myId = userData?.user?.id ?? null;
      if (!myId) return;

      // Optimistic: show my tap immediately; the realtime echo confirms it.
      const optimistic: Reaction = {
        id: `optimistic-${promptId}`,
        couple_drop_id: coupleDropId,
        prompt_id: promptId,
        author: myId,
        emoji,
        created_at: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, myId, reactions: mergeReaction(prev.reactions, optimistic) }));

      const { error } = await supabase
        .from('reactions')
        .upsert(
          // @ts-expect-error supabase-js typed .upsert() resolves the row to never (known Database-generic limitation)
          { couple_drop_id: coupleDropId, prompt_id: promptId, author: myId, emoji },
          { onConflict: 'couple_drop_id,prompt_id,author' }
        );

      if (error) {
        // Never leave a fabricated reaction on screen: reload the truth.
        const { data } = await supabase
          .from('reactions')
          .select('id, couple_drop_id, prompt_id, author, emoji, created_at')
          .eq('couple_drop_id', coupleDropId);
        setState((prev) => ({
          ...prev,
          reactions: (data || []) as Reaction[],
          error: new Error(error.message),
        }));
      }
    },
    [coupleDropId]
  );

  return { ...state, react };
}
