import { getTrialEndDateString } from './billing';

describe('billing', () => {
  describe('getTrialEndDateString', () => {
    it('computes trial end date 7 days from now', () => {
      const ref = new Date('2026-07-05');
      const result = getTrialEndDateString(7, ref);
      expect(result).toBe('July 12, 2026');
    });

    it('returns placeholder when trial days undefined', () => {
      const result = getTrialEndDateString(undefined);
      expect(result).toBe('trial ends [date]');
    });

    it('handles different trial periods', () => {
      const ref = new Date('2026-07-05');
      const result = getTrialEndDateString(30, ref);
      expect(result).toBe('August 4, 2026');
    });
  });
});
