import GradientText from './GradientText';

test('renders GradientText with style', () => {
  expect(<GradientText style={{ fontSize: 50 }}>83%</GradientText>).toBeTruthy();
});

test('renders GradientText with custom gradient', () => {
  expect(
    <GradientText style={{ fontSize: 50 }} gradient={['#FF0000', '#00FF00']}>
      Wave
    </GradientText>
  ).toBeTruthy();
});
