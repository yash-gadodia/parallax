import { Wordmark, Slashes } from './Wordmark';
import { Mark } from './Mark';

test('Wordmark renders without throwing', () => {
  expect(<Wordmark />).toBeTruthy();
});

test('Wordmark with offset renders without throwing', () => {
  expect(<Wordmark offset />).toBeTruthy();
});

test('Slashes renders without throwing', () => {
  expect(<Slashes />).toBeTruthy();
});

test('Mark renders without throwing', () => {
  expect(<Mark />).toBeTruthy();
});
