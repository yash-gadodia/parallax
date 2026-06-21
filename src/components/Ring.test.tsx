import { render } from '@testing-library/react-native';
import { Ring } from './Ring';

test('renders Ring with pct=83', () => {
  expect(() => render(<Ring pct={83} />)).not.toThrow();
});

test('renders Ring with pct=0', () => {
  expect(() => render(<Ring pct={0} />)).not.toThrow();
});

test('renders Ring with animate=false', () => {
  expect(() => render(<Ring pct={50} animate={false} />)).not.toThrow();
});

test('renders Ring with custom size', () => {
  expect(() => render(<Ring pct={75} size={200} />)).not.toThrow();
});
