import {
  driftReminderBody,
  driftTitle,
  streakSaverBody,
  streakSaverTitle,
} from '../../../supabase/functions/scheduled-pushes/copy';

describe('streak saver copy', () => {
  it('names the partner in the title', () => {
    expect(streakSaverTitle('Dani')).toBe('your streak with Dani ends at midnight ⏳');
  });

  it('says the partner already played, no guilt', () => {
    expect(streakSaverBody('Dani')).toBe(
      'Dani already played — your answer keeps the streak alive 💛'
    );
  });
});

describe('drift reminder copy', () => {
  it('has a warm title', () => {
    expect(driftTitle()).toBe("today's drop is still open 💛");
  });

  it('rotates the 3 variants deterministically by couple-local date', () => {
    expect(driftReminderBody('Dani', '2027-01-05')).toBe(
      'two spare minutes? see what Dani would say today 🫶'
    );
    expect(driftReminderBody('Dani', '2027-01-06')).toBe(
      'your daily moment with Dani is still there ☕'
    );
    expect(driftReminderBody('Dani', '2027-01-07')).toBe(
      'one small question before the day ends — Dani might surprise you ✨'
    );
  });

  it('is stable for the same date', () => {
    expect(driftReminderBody('Sam', '2027-02-14')).toBe(driftReminderBody('Sam', '2027-02-14'));
  });

  it('falls back to the first variant on a malformed date', () => {
    expect(driftReminderBody('Dani', 'not-a-date')).toBe(
      'your daily moment with Dani is still there ☕'
    );
  });
});
