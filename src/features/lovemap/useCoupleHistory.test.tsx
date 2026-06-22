import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useCoupleHistory } from './useCoupleHistory';
import { ARCHIVE } from '../../content/drop';

jest.mock('../auth/useSession', () => ({
  useSession: () => ({ session: null, loading: false }),
}));

jest.mock('../pairing/useCouple', () => ({
  useCouple: () => ({ couple: null, loading: false, status: 'none' }),
}));

describe('useCoupleHistory', () => {
  describe('returns sample history when no session/couple', () => {
    it('returns ARCHIVE as sample history when session and couple are both null', async () => {
      let capturedState: any = null;

      function TestComponent() {
        const state = useCoupleHistory();
        capturedState = state;
        return null;
      }

      await act(async () => {
        render(<TestComponent />);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // State should be settled
      expect(capturedState.loading).toBe(false);
      expect(capturedState.isSample).toBe(true);
      expect(capturedState.error).toBe(null);

      // Should have same count as ARCHIVE
      expect(capturedState.history).toHaveLength(ARCHIVE.length);

      // Verify the structure matches CoupleHistoryRow
      capturedState.history.forEach((row: any, idx: number) => {
        const archiveItem = ARCHIVE[idx];
        expect(row.code).toBe(archiveItem.code);
        expect(row.title).toBe(archiveItem.title);
        expect(row.wavelength).toBe(archiveItem.wave);
        expect(row.twins_count).toBe(archiveItem.twins);
        // date is today's ISO string (date part)
        expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('maps ARCHIVE fields to CoupleHistoryRow shape correctly', async () => {
      let capturedState: any = null;

      function TestComponent() {
        const state = useCoupleHistory();
        capturedState = state;
        return null;
      }

      await act(async () => {
        render(<TestComponent />);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(capturedState.history).toHaveLength(3);

      // Verify first item (DROP 26)
      const first = capturedState.history[0];
      expect(first.code).toBe('DROP 26');
      expect(first.title).toBe('the ick list');
      expect(first.wavelength).toBe(88);
      expect(first.twins_count).toBe(2);

      // Verify second item (DROP 25)
      const second = capturedState.history[1];
      expect(second.code).toBe('DROP 25');
      expect(second.title).toBe('future tense');
      expect(second.wavelength).toBe(74);
      expect(second.twins_count).toBe(1);

      // Verify third item (DROP 24)
      const third = capturedState.history[2];
      expect(third.code).toBe('DROP 24');
      expect(third.title).toBe('red flags');
      expect(third.wavelength).toBe(80);
      expect(third.twins_count).toBe(2);
    });

    it('marks sample history with isSample=true', async () => {
      let capturedState: any = null;

      function TestComponent() {
        const state = useCoupleHistory();
        capturedState = state;
        return null;
      }

      await act(async () => {
        render(<TestComponent />);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(capturedState.isSample).toBe(true);
    });
  });
});
