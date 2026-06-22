import { usePlayStore, computeReveal } from './play';

describe('play store', () => {
  beforeEach(() => {
    usePlayStore.getState().reset();
  });

  it('starts empty (pick phase, no answers)', () => {
    const s = usePlayStore.getState();
    expect(s.myPicks).toEqual([null, null, null]);
    expect(s.myHunches).toEqual([null, null, null]);
    expect(s.phase).toBe('pick');
    expect(s.done).toBe(false);
  });

  it('setPick / setHunch record at the given prompt index', () => {
    usePlayStore.getState().setPick(1, 4);
    usePlayStore.getState().setHunch(2, 0);
    const s = usePlayStore.getState();
    expect(s.myPicks).toEqual([null, 4, null]);
    expect(s.myHunches).toEqual([null, null, 0]);
  });

  it('reset clears all answers', () => {
    usePlayStore.getState().setPick(0, 2);
    usePlayStore.getState().reset();
    expect(usePlayStore.getState().myPicks).toEqual([null, null, null]);
  });

  describe('computeReveal', () => {
    it('falls back to demo answers when nothing has been played (solo reveal)', () => {
      // regression: an unplayed solo reveal must still score (the empty-chip fix).
      const reveal = computeReveal(usePlayStore.getState());
      expect(reveal).toEqual({ yourHits: 2, theirHits: 0, twins: 1, wave: 33 });
    });

    it('scores the real answers once played', () => {
      const st = usePlayStore.getState();
      st.setPick(0, 0);
      st.setPick(1, 0);
      st.setPick(2, 0);
      st.setHunch(0, 0);
      st.setHunch(1, 0);
      st.setHunch(2, 0);
      const reveal = computeReveal(usePlayStore.getState());
      expect(reveal).toEqual({ yourHits: 0, theirHits: 1, twins: 0, wave: 17 });
    });
  });
});
