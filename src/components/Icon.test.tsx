import { Icon, ICONS } from './Icon';

test('renders a known icon path', () => {
  expect(ICONS.home).toBeTruthy();
  expect(ICONS.heart).toBeTruthy();
});

test('icon has all required paths', () => {
  const requiredIcons = ['spark', 'home', 'cards', 'us', 'back', 'fwd', 'chevR', 'check', 'cross', 'share', 'flame', 'lock', 'heart', 'copy', 'close', 'bell', 'gear', 'plus', 'send', 'chat', 'pencil', 'bolt', 'link', 'logout', 'grid', 'stack', 'apple', 'card', 'star'];
  requiredIcons.forEach(icon => {
    expect(ICONS[icon as keyof typeof ICONS]).toBeTruthy();
  });
});
