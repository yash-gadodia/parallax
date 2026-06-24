import { learningOrigin } from './learningOrigin';

describe('learningOrigin', () => {
  it('is deterministic for the same content', () => {
    const a = learningOrigin(['you both care', 'timing collided'], 'a tiny text keeps quiet from meaning forgotten');
    const b = learningOrigin(['you both care', 'timing collided'], 'a tiny text keeps quiet from meaning forgotten');
    expect(a).toBe(b);
  });

  it('differs when the resolution content differs', () => {
    const a = learningOrigin(['you both care'], 'wayback one');
    const b = learningOrigin(['you both care'], 'wayback two');
    expect(a).not.toBe(b);
  });

  it('returns a non-empty base36 string', () => {
    const o = learningOrigin(['x'], 'y');
    expect(o).toMatch(/^[0-9a-z]+$/);
    expect(o.length).toBeGreaterThan(0);
  });
});
