import { render } from '@testing-library/react-native';
import { RadialGlow } from './RadialGlow';

test('RadialGlow renders an SVG tree with the coral flame glow defaults', async () => {
  const { toJSON } = await render(<RadialGlow color="#FF8E7A" opacity={0.32} r="50%" stop={0.65} />);
  const tree = toJSON();
  expect(tree).not.toBeNull();
});

test('RadialGlow renders the white top sheen variant', async () => {
  const { toJSON } = await render(
    <RadialGlow color="#ffffff" opacity={0.4} cx="50%" cy="0%" r="80%" stop={0.6} />
  );
  expect(toJSON()).not.toBeNull();
});
