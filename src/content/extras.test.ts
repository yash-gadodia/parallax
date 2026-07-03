import { PACKS } from './extras';

// The tint contract: packDetail.tsx resolves pack.tint through this exact map
// (unknown keys silently fall back to p2) — every registry entry must use one.
const RESOLVABLE_TINTS = ['var(--p2)', 'var(--p1)', 'var(--match)', 'var(--p2-deep)'];

describe('PACKS registry', () => {
  it('registers the SG pack keyed to the 0031 sg catalog theme', () => {
    expect(PACKS.find((p) => p.id === 'sg')).toEqual({
      id: 'sg',
      emoji: '🍜',
      title: 'Little red dot',
      tag: 'sg couple things',
      tint: 'var(--p1)',
      locked: true,
      theme: 'sg',
    });
  });

  it('registers the LDR pack keyed to the 0031 ldr catalog theme', () => {
    expect(PACKS.find((p) => p.id === 'ldr')).toEqual({
      id: 'ldr',
      emoji: '✈️',
      title: 'Same moon',
      tag: 'miles apart',
      tint: 'var(--p2)',
      locked: true,
      theme: 'ldr',
    });
  });

  it('has unique ids and unique themes (send_pack + usePackSamples key off theme)', () => {
    const ids = PACKS.map((p) => p.id);
    const themes = PACKS.map((p) => p.theme);
    expect(new Set(ids).size).toBe(PACKS.length);
    expect(new Set(themes).size).toBe(PACKS.length);
  });

  it('keeps exactly one free pack (deep) — the rest are Plus-locked', () => {
    expect(PACKS.filter((p) => !p.locked).map((p) => p.id)).toEqual(['deep']);
  });

  it('uses only tints that packDetail can resolve to a real color', () => {
    expect(PACKS.filter((p) => !RESOLVABLE_TINTS.includes(p.tint))).toEqual([]);
  });
});
