import { colors, radius } from './tokens';

test('core palette matches the spec exactly', () => {
  expect(colors.p1).toBe('#FF8E7A');
  expect(colors.p1Deep).toBe('#EF6A53');
  expect(colors.p2).toBe('#9D95F5');
  expect(colors.p2Deep).toBe('#7064E6');
  expect(colors.match).toBe('#54C2A0');
  expect(colors.matchDeep).toBe('#2E9C7C');
  expect(colors.ink).toBe('#3A3340');
  expect(colors.surface).toBe('#FFFDFD');
  expect(colors.sunken).toBe('#F4ECF4');
});

test('pill radius is 999', () => {
  expect(radius.pill).toBe(999);
});
