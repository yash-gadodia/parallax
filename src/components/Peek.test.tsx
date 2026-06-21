import { render } from '@testing-library/react-native';
import { Peek } from './Peek';

test('renders Peek with happy mood (default)', () => {
  expect(() => render(<Peek />)).not.toThrow();
});

test('renders Peek with focus mood', () => {
  expect(() => render(<Peek mood="focus" />)).not.toThrow();
});

test('renders Peek with search mood', () => {
  expect(() => render(<Peek mood="search" />)).not.toThrow();
});

test('renders Peek with love mood', () => {
  expect(() => render(<Peek mood="love" />)).not.toThrow();
});

test('renders Peek with custom size', () => {
  expect(() => render(<Peek size={120} mood="happy" />)).not.toThrow();
});
