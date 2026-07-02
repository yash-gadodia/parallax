import { seededPickIds } from './usePracticeRound';

const POOL = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

describe('seededPickIds', () => {
  it('is deterministic: the same seed always yields the same picks, in order', () => {
    expect(seededPickIds(POOL, 'c1:2026-07-02', 3)).toEqual(['p2', 'p3', 'p1']);
    expect(seededPickIds(POOL, 'c1:2026-07-02', 3)).toEqual(['p2', 'p3', 'p1']);
  });

  it('varies by couple-local day (the seed), not by call', () => {
    expect(seededPickIds(POOL, 'c1:2026-07-03', 3)).toEqual(['p4', 'p6', 'p2']);
    expect(seededPickIds(POOL, 'c1:2026-07-04', 3)).toEqual(['p3', 'p1', 'p6']);
  });

  it('varies by couple for the same day', () => {
    expect(seededPickIds(POOL, 'c2:2026-07-02', 3)).toEqual(['p1', 'p3', 'p5']);
  });

  it('never fabricates: a pool smaller than count returns just the pool', () => {
    expect(seededPickIds(['a', 'b'], 'c1:2026-07-02', 3)).toEqual(['a', 'b']);
    expect(seededPickIds([], 'c1:2026-07-02', 3)).toEqual([]);
  });

  it('does not mutate the input pool', () => {
    const input = [...POOL];
    seededPickIds(input, 'c1:2026-07-02', 3);
    expect(input).toEqual(POOL);
  });
});
