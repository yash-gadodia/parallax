import { fontFamily, kickStyle } from './typography';

test('mono kicker is 10px / 0.18em uppercase', () => {
  expect(kickStyle.fontFamily).toBe(fontFamily.mono);
  expect(kickStyle.fontSize).toBe(10);
  expect(kickStyle.letterSpacing).toBeCloseTo(1.8, 5); // 0.18em * 10px
  expect(kickStyle.textTransform).toBe('uppercase');
});
