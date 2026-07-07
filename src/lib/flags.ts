import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { FeatureFlag } from '../types/db';

// V2 feature flags (eng gate §11.6): OTA-toggleable kill switches, one row per
// flag in the feature_flags table (service_role-writable only — flip them in
// the Supabase dashboard). Every flag is OFF by default and OFF on any fetch
// failure: a surface must never appear because the network hiccuped.
export const FLAGS = {
  F1_MOOD_CHECK: 'f1_mood_check',
  F1_PARTNER_NOTIFY: 'f1_partner_notify',
  F2_REPAIR_CHECKIN: 'f2_repair_checkin',
  F3_WEAVE: 'f3_weave',
  F5_GROWTH_COUNTER: 'f5_growth_counter',
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

const KNOWN_KEYS = new Set<string>(Object.values(FLAGS));

let cache: Partial<Record<FlagKey, boolean>> = {};
let inflight: Promise<void> | null = null;

/** Current value from the last successful load; false until then. */
export function isFlagOn(key: FlagKey): boolean {
  return cache[key] === true;
}

/**
 * Fetch flag rows once per session (concurrent callers share the request).
 * Errors are swallowed: the cache simply stays at the OFF defaults.
 */
export function loadFlags(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('key, enabled');
      if (error || !data) return;
      // supabase-js typed select infers the row as never (known quirk, see
      // .claude/rules/database.md) — pin the shape we selected.
      const rows = data as ReadonlyArray<Pick<FeatureFlag, 'key' | 'enabled'>>;
      for (const row of rows) {
        if (KNOWN_KEYS.has(row.key)) {
          cache[row.key as FlagKey] = row.enabled === true;
        }
      }
    } catch {
      // offline / transient — defaults (OFF) stand
    }
  })();
  return inflight;
}

/** Hook: OFF on first render, updates once the session's load resolves. */
export function useFlag(key: FlagKey): boolean {
  const [on, setOn] = useState(() => isFlagOn(key));
  useEffect(() => {
    let cancelled = false;
    loadFlags().then(() => {
      if (!cancelled) setOn(isFlagOn(key));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return on;
}

/** Test-only: clear the cache and inflight fetch. */
export function __resetFlagsForTest(): void {
  cache = {};
  inflight = null;
}
