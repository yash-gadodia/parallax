import { supabase } from '../../lib/supabase';

interface AddLearningParams {
  coupleId: string;
  aboutId: string;
  emoji: string;
  need: string;
  detail: string;
  source: 'drop' | 'refocus';
  origin: string;
}

export async function addLearning(params: AddLearningParams): Promise<string> {
  const { coupleId, aboutId, emoji, need, detail, source, origin } = params;

  try {
    const { data, error } = await supabase.rpc(
      'add_learning' as never,
      {
        p_couple: coupleId,
        p_about: aboutId,
        p_emoji: emoji,
        p_need: need,
        p_detail: detail,
        p_source: source,
        p_origin: origin,
      } as never
    );

    if (error) throw error;

    return data as string;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to add learning');
  }
}
