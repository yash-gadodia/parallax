import { Peek } from './Peek';

test('renders Peek with happy mood (default)', () => {
  expect(<Peek />).toBeTruthy();
});

test('renders Peek with focus mood', () => {
  expect(<Peek mood="focus" />).toBeTruthy();
});

test('renders Peek with search mood', () => {
  expect(<Peek mood="search" />).toBeTruthy();
});

test('renders Peek with love mood', () => {
  expect(<Peek mood="love" />).toBeTruthy();
});

test('renders Peek with custom size', () => {
  expect(<Peek size={120} mood="happy" />).toBeTruthy();
});
