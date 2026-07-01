import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/db';
import { useCouple } from '../pairing/useCouple';
import { normaliseSpiceLevel, SpiceLevel } from '../../domain/spice';

// Generic label shown to a real, signed-in user whose partner hasn't joined yet.
// Screens render this instead of leaking the demo persona "Dani".
export const GENERIC_PARTNER_NAME = 'your partner';

export interface ProfileData {
  name: string;
  partnerName: string;
  spiceLevel: string;
  notifyTime: string | null;
  togetherSince: string | null;
  streak: number;
  loading: boolean;
}

// The demo identity — used ONLY when unauthenticated (no session), where the
// solo/sim partner genuinely is "Dani". A real signed-in couple never sees these.
const DEMO = {
  name: 'Yash',
  partnerName: 'Dani',
  spiceLevel: 'Flirty',
  notifyTime: null as string | null,
  togetherSince: 'February 2024' as string | null,
  streak: 23,
};

// Only the async-fetched fields live in state; couple-derived values (streak,
// togetherSince) are computed synchronously on render so realtime couple updates
// reflect immediately without re-running the fetch effect.
interface FetchedProfile {
  authed: boolean;
  name: string;
  partnerName: string;
  spiceLevel: string;
  notifyTime: string | null;
  loading: boolean;
}

export function useProfile(): ProfileData & {
  updateProfile: (display_name: string, together_since?: string) => Promise<void>;
  updateSpiceLevel: (level: SpiceLevel) => Promise<void>;
} {
  const { couple } = useCouple();
  const [fetched, setFetched] = useState<FetchedProfile>({
    authed: false,
    name: DEMO.name,
    partnerName: DEMO.partnerName,
    spiceLevel: DEMO.spiceLevel,
    notifyTime: DEMO.notifyTime,
    loading: true,
  });

  // Effect is keyed on stable primitives (couple id + members), NOT the couple
  // object reference — otherwise an unstable ref would re-run the effect every
  // render (setState → re-render → new ref → loop). member_b null→uid re-fetches
  // the partner name the moment they join.
  const coupleId = couple?.id ?? null;
  const memberA = couple?.member_a ?? null;
  const memberB = couple?.member_b ?? null;

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (!uid) {
      setFetched({
        authed: false,
        name: DEMO.name,
        partnerName: DEMO.partnerName,
        spiceLevel: DEMO.spiceLevel,
        notifyTime: DEMO.notifyTime,
        loading: false,
      });
      return;
    }

    const { data: profile } = (await supabase
      .from('profiles')
      .select('display_name,spice_level,notify_time')
      .eq('id', uid)
      .maybeSingle()) as { data: Pick<Profile, 'display_name' | 'spice_level' | 'notify_time'> | null };

    // Authenticated users get the real partner name, or a generic label while
    // pending — never the demo persona "Dani" (that's reserved for no-session).
    let partnerName = GENERIC_PARTNER_NAME;
    const partnerId = memberA === uid ? memberB : memberA;
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

    setFetched({
      authed: true,
      name: profile?.display_name || DEMO.name,
      partnerName,
      spiceLevel: normaliseSpiceLevel(profile?.spice_level) || DEMO.spiceLevel,
      notifyTime: profile?.notify_time ?? null,
      loading: false,
    });
  }, [coupleId, memberA, memberB]);

  useEffect(() => {
    load();
  }, [load]);

  // Couple-derived values: honest (0 / null) for a real couple with none yet;
  // the demo values only when unauthenticated.
  const data: ProfileData = {
    name: fetched.name,
    partnerName: fetched.partnerName,
    spiceLevel: fetched.spiceLevel,
    notifyTime: fetched.notifyTime,
    togetherSince: fetched.authed ? (couple?.together_since ?? null) : DEMO.togetherSince,
    streak: fetched.authed ? (couple?.streak ?? 0) : DEMO.streak,
    loading: fetched.loading,
  };

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

      setFetched((prev) => ({ ...prev, name: display_name }));
    },
    [couple]
  );

  const updateSpiceLevel = useCallback(async (level: SpiceLevel) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    // @ts-expect-error supabase-js typed .update() resolves to never for partial profile updates
    await supabase.from('profiles').update({ spice_level: level.toLowerCase() }).eq('id', uid);

    setFetched((prev) => ({ ...prev, spiceLevel: level }));
  }, []);

  return { ...data, updateProfile, updateSpiceLevel };
}
