import type { Prompt, PromptSpice, Drop } from '../content/drop';

export type SpiceLevel = 'Sweet' | 'Flirty' | 'Spicy';

// Maps UI-facing SpiceLevel (capitalised, as stored in profiles.spice_level) to
// the lowercase tier used on prompts.
const SPICE_TIER: Record<SpiceLevel, PromptSpice> = {
  Sweet: 'sweet',
  Flirty: 'flirty',
  Spicy: 'spicy',
};

// Tier ordering so "Spicy" includes flirty + sweet prompts too.
const TIER_RANK: Record<PromptSpice, number> = {
  sweet: 0,
  flirty: 1,
  spicy: 2,
};

export function promptAllowedAt(prompt: Prompt, level: SpiceLevel): boolean {
  const allowed = SPICE_TIER[level];
  return TIER_RANK[prompt.spice] <= TIER_RANK[allowed];
}

export function filterPromptsBySpice(prompts: Prompt[], level: SpiceLevel): Prompt[] {
  return prompts.filter((p) => promptAllowedAt(p, level));
}

export function selectDropForSpice(drop: Drop, level: SpiceLevel): Drop {
  return { ...drop, prompts: filterPromptsBySpice(drop.prompts, level) };
}

export function normaliseSpiceLevel(raw: string | null | undefined): SpiceLevel {
  const map: Record<string, SpiceLevel> = {
    sweet: 'Sweet',
    flirty: 'Flirty',
    spicy: 'Spicy',
    Sweet: 'Sweet',
    Flirty: 'Flirty',
    Spicy: 'Spicy',
  };
  return map[raw ?? ''] ?? 'Flirty';
}
