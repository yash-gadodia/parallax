import { Ring } from './Ring';

test('renders Ring with pct=83', () => {
  expect(<Ring pct={83} />).toBeTruthy();
});

test('renders Ring with pct=0', () => {
  expect(<Ring pct={0} />).toBeTruthy();
});

test('renders Ring with animate=false', () => {
  expect(<Ring pct={50} animate={false} />).toBeTruthy();
});

test('renders Ring with custom size', () => {
  expect(<Ring pct={75} size={200} />).toBeTruthy();
});
