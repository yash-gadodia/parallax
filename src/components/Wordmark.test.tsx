import { render } from '@testing-library/react-native';
import { Wordmark, Slashes } from './Wordmark';
import { Mark } from './Mark';

test('Wordmark renders without throwing', () => {
  expect(() => render(<Wordmark />)).not.toThrow();
});

test('Wordmark with offset renders without throwing', () => {
  expect(() => render(<Wordmark offset />)).not.toThrow();
});

test('Slashes renders without throwing', () => {
  expect(() => render(<Slashes />)).not.toThrow();
});

test('Mark renders without throwing', () => {
  expect(() => render(<Mark />)).not.toThrow();
});
