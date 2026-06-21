import { isValidInviteCode, normalizeInviteCode, formatInviteCode } from './inviteCode';

describe('invite code domain logic', () => {
  describe('isValidInviteCode', () => {
    it('returns true for valid canonical format', () => {
      expect(isValidInviteCode('YASH-4827')).toBe(true);
      expect(isValidInviteCode('ABCD-1234')).toBe(true);
      expect(isValidInviteCode('ABC0-5678')).toBe(true);
    });

    it('returns false for lowercase', () => {
      expect(isValidInviteCode('yash-4827')).toBe(false);
      expect(isValidInviteCode('yash4827')).toBe(false);
    });

    it('returns false for wrong format', () => {
      expect(isValidInviteCode('ABCD-12')).toBe(false); // too short
      expect(isValidInviteCode('ABCD-12345')).toBe(false); // too long
      expect(isValidInviteCode('ABCD1234')).toBe(false); // missing dash
      expect(isValidInviteCode('ABCD--1234')).toBe(false); // double dash
      expect(isValidInviteCode('AB-1234')).toBe(false); // first part too short
      expect(isValidInviteCode('ABCDE-1234')).toBe(false); // first part too long
    });

    it('returns false for non-alphanumeric in first part', () => {
      expect(isValidInviteCode('AB@D-1234')).toBe(false);
      expect(isValidInviteCode('ABCD-ABC4')).toBe(false); // letters in second part
    });

    it('returns false for empty string', () => {
      expect(isValidInviteCode('')).toBe(false);
    });
  });

  describe('normalizeInviteCode', () => {
    it('normalizes user input to canonical format', () => {
      expect(normalizeInviteCode('yash 4827')).toBe('YASH-4827');
      expect(normalizeInviteCode('yash4827')).toBe('YASH-4827');
      expect(normalizeInviteCode('YASH-4827')).toBe('YASH-4827');
      expect(normalizeInviteCode('YASH 4827')).toBe('YASH-4827');
    });

    it('removes all non-alphanumeric characters', () => {
      expect(normalizeInviteCode('yash-4827')).toBe('YASH-4827');
      expect(normalizeInviteCode('y a s h 4 8 2 7')).toBe('YASH-4827');
      expect(normalizeInviteCode('yash.4827')).toBe('YASH-4827');
    });

    it('handles mixed case', () => {
      expect(normalizeInviteCode('YaSh-4827')).toBe('YASH-4827');
      expect(normalizeInviteCode('AbCd1234')).toBe('ABCD-1234');
    });

    it('pads or truncates to 8 alphanumeric characters and formats as XXXX-XXXX', () => {
      // Exactly 8 alnum chars
      expect(normalizeInviteCode('abcd1234')).toBe('ABCD-1234');
      // More than 8 alnum chars: take first 8
      expect(normalizeInviteCode('abcd123456')).toBe('ABCD-1234');
      // Fewer than 8 alnum chars: dash after 4th if available, else at end
      expect(normalizeInviteCode('abc1')).toBe('ABC1-');
      expect(normalizeInviteCode('ab1')).toBe('AB1-');
      expect(normalizeInviteCode('abcd123')).toBe('ABCD-123');
    });

    it('returns empty-ish for no alphanumeric input', () => {
      // Edge case: input with no alphanumeric chars becomes a dash
      expect(normalizeInviteCode('!@#$')).toBe('-');
    });
  });

  describe('formatInviteCode', () => {
    it('formats an 8-character raw code as XXXX-XXXX', () => {
      expect(formatInviteCode('ABCD1234')).toBe('ABCD-1234');
      expect(formatInviteCode('YASH4827')).toBe('YASH-4827');
    });

    it('uppercases the input', () => {
      expect(formatInviteCode('abcd1234')).toBe('ABCD-1234');
    });

    it('handles non-8-char inputs gracefully', () => {
      // Behavior: take first 8 chars if longer, or pad/use what we have
      expect(formatInviteCode('ABCD')).toBe('ABCD-');
      expect(formatInviteCode('ABCD123456')).toBe('ABCD-1234');
    });
  });
});
