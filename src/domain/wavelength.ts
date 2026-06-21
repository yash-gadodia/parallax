export const peekMoodForWave = (w: number) =>
  w >= 70 ? 'focus' : w >= 45 ? 'happy' : 'search';
