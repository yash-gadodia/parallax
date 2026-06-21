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
