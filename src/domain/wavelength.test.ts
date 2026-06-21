import { peekMoodForWave } from './wavelength';

test('mood thresholds', () => {
  expect(peekMoodForWave(70)).toBe('focus');
  expect(peekMoodForWave(69)).toBe('happy');
  expect(peekMoodForWave(45)).toBe('happy');
  expect(peekMoodForWave(44)).toBe('search');
  expect(peekMoodForWave(0)).toBe('search');
  expect(peekMoodForWave(100)).toBe('focus');
});
