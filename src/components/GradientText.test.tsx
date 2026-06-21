import { render } from '@testing-library/react-native';
import GradientText from './GradientText';

test('renders gradient text and shows the content', async () => {
  const { getAllByText } = await render(
    <GradientText style={{ fontSize: 50 }}>83%</GradientText>
  );
  const matches = getAllByText('83%');
  expect(matches.length).toBeGreaterThanOrEqual(1);
});

test('renders with a custom gradient', async () => {
  const { getAllByText } = await render(
    <GradientText style={{ fontSize: 20 }} gradient={['#FF8E7A', '#9D95F5']}>
      hi
    </GradientText>
  );
  const matches = getAllByText('hi');
  expect(matches.length).toBeGreaterThanOrEqual(1);
});
