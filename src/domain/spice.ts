export type SpiceLevel = 'Sweet' | 'Flirty' | 'Spicy';

// profiles.spice_level is stored inconsistently (lowercase from older writes,
// capitalised from newer ones); normalise both ways to the UI-facing form.
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
