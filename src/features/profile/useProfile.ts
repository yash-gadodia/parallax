import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/db';
import { useCouple } from '../pairing/useCouple';

export interface ProfileData {
  name: string;
  partnerName: string;
  spiceLevel: string;
  notifyTime: string | null;
  togetherSince: string | null;
  streak: number;
  loading: boolean;
}

const DEMO: ProfileData = {
  name: 'Yash',
  partnerName: 'Dani',
  spiceLevel: 'Flirty',
  notifyTime: null,
  togetherSince: 'February 2024',
  streak: 23,
  loading: false,
};

export function useProfile(): ProfileData & {
  updateProfile: (display_name: string, together_since?: string) => Promise<void>;
} {
  const { couple } = useCouple();
  const [data, setData] = useState<ProfileData>({ ...DEMO, loading: true });

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (!uid) {
      setData({ ...DEMO, loading: false });
      return;
    }

    const { data: profile } = (await supabase
      .from('profiles')
      .select('display_name,spice_level,notify_time')
      .eq('id', uid)
      .maybeSingle()) as { data: Pick<Profile, 'display_name' | 'spice_level' | 'notify_time'> | null };

    let partnerName = DEMO.partnerName;
    if (couple) {
      const partnerId = couple.member_a === uid ? couple.member_b : couple.member_a;
      if (partnerId) {
        const { data: partnerProfile } = (await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', partnerId)
          .maybeSingle()) as { data: Pick<Profile, 'display_name'> | null };
        if (partnerProfile?.display_name) {
          partnerName = partnerProfile.display_name;
        }
      }
    }

    setData({
      name: profile?.display_name || DEMO.name,
      partnerName,
      spiceLevel: profile?.spice_level || DEMO.spiceLevel,
      notifyTime: profile?.notify_time ?? null,
      togetherSince: couple?.together_since ?? DEMO.togetherSince,
      streak: couple?.streak ?? DEMO.streak,
      loading: false,
    });
  }, [couple]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (display_name: string, together_since?: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      // @ts-expect-error supabase-js typed .update() resolves to never for partial profile updates
      await supabase.from('profiles').update({ display_name }).eq('id', uid);

      if (together_since !== undefined && couple) {
        // @ts-expect-error supabase-js typed .update() resolves to never for partial couple updates
        await supabase.from('couples').update({ together_since }).eq('id', couple.id);
      }

      setData((prev) => ({
        ...prev,
        name: display_name,
        togetherSince: together_since ?? prev.togetherSince,
      }));
    },
    [couple]
  );

  return { ...data, updateProfile };
}
