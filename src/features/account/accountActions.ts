import { Share } from 'react-native';
import { supabase } from '../../lib/supabase';

export async function deleteMyAccount(): Promise<void> {
  // Edge function erases app data (via delete_my_account) AND the Supabase Auth
  // record — full, App-Store-grade deletion the client RPC alone can't do.
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) {
    throw error;
  }
}

export async function exportMyData(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;

  if (!uid) {
    throw new Error('Not signed in');
  }

  const [profileResult, answersResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('answers').select('*').eq('author', uid),
  ]);

  const coupleRes = await supabase
    .from('couples')
    .select('id')
    .or(`member_a.eq.${uid},member_b.eq.${uid}`)
    .maybeSingle();

  const coupleId = (coupleRes.data as { id: string } | null)?.id ?? null;
  const learningsResult = coupleId
    ? await supabase.from('learnings').select('*').eq('couple_id', coupleId)
    : { data: [] };

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profileResult.data ?? null,
    answers: answersResult.data ?? [],
    learnings: learningsResult.data ?? [],
  };

  const json = JSON.stringify(payload, null, 2);

  await Share.share({
    title: 'My Parallax data',
    message: json,
  });
}
