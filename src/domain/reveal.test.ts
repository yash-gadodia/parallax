import { scoreReveal } from './reveal';

const p = (youPick:number, youHunch:number, themPick:number, themHunch:number) => ({youPick,youHunch,themPick,themHunch});

test('perfect sync → wave 100, all hits, twins counted', () => {
  const r = scoreReveal([p(1,1,1,1), p(0,0,0,0), p(2,2,2,2)]);
  expect(r).toEqual({ yourHits: 3, theirHits: 3, twins: 3, wave: 100 });
});

test('half the hunches land → wave 50', () => {
  // yourHits: youHunch===themPick → [1==1 ✓, 4==0 ✗, 1==3 ✗] = 1
  // theirHits: themHunch===youPick → [4==1 ✗, 0==1 ✗, 1==3 ✗]... build exact:
  const r = scoreReveal([p(1,1,1,1), p(1,0,0,1), p(0,0,1,0)]);
  // yourHits: 1==1✓,0==0✓,0==1✗ =2 ; theirHits: 1==1✓,1==1✓,0==0✓=3 → (2+3)/6=83.33→83
  expect(r.yourHits).toBe(2); expect(r.theirHits).toBe(3); expect(r.wave).toBe(83);
});

test('no overlap → wave 0', () => {
  expect(scoreReveal([p(0,1,2,3)])).toEqual({ yourHits:0, theirHits:0, twins:0, wave:0 });
});

test('empty → wave 0, no NaN', () => {
  expect(scoreReveal([])).toEqual({ yourHits:0, theirHits:0, twins:0, wave:0 });
});

// --- 1.5: twin-run escalation + the conversation spark ----------------------

import { mutualReadRun, biggestMissIndex } from './reveal';

test('mutualReadRun: 3 consecutive mutual reads → 3 (the 🔥 moment)', () => {
  expect(mutualReadRun([p(1,2,2,1), p(0,1,1,0), p(2,0,0,2)])).toBe(3);
});

test('mutualReadRun: a one-sided hit breaks the run', () => {
  // prompt 2: you read them (1===1) but they miss you (2 vs 0) → run resets
  expect(mutualReadRun([p(1,2,2,1), p(0,1,1,2), p(2,0,0,2)])).toBe(1);
});

test('mutualReadRun: empty → 0', () => {
  expect(mutualReadRun([])).toBe(0);
});

test('biggestMissIndex: prefers the prompt where BOTH hunches missed', () => {
  // i0: both hit · i1: one misses · i2: both miss → 2
  expect(biggestMissIndex([p(1,2,2,1), p(0,1,1,2), p(2,1,0,1)])).toBe(2);
});

test('biggestMissIndex: falls back to a one-sided miss', () => {
  // i0 both hit, i1 one-sided miss → 1
  expect(biggestMissIndex([p(1,2,2,1), p(0,1,1,2)])).toBe(1);
});

test('biggestMissIndex: null when every hunch landed (nothing to unpack)', () => {
  expect(biggestMissIndex([p(1,2,2,1), p(0,1,1,0)])).toBe(null);
});
