import { mapActivityToDisplay, formatActivityTime, type DisplayActivity } from './activityFormatter';
import type { Activity } from '../../types/db';

describe('activityFormatter', () => {
  describe('mapActivityToDisplay', () => {
    it('maps "played" kind to correct emoji/title/cta', () => {
      const activity: Activity = {
        id: 'activity-1',
        couple_id: 'couple-1',
        kind: 'played',
        actor: 'dani-id',
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('💌');
      expect(result.title).toBe('Partner played today\'s drop');
      expect(result.body).toBe('Your turn, no peeking at theirs.');
      expect(result.cta).toBe('play');
      expect(result.who).toBe('dani');
    });

    it('maps "nudge" kind to correct emoji/title/cta', () => {
      const activity: Activity = {
        id: 'activity-2',
        couple_id: 'couple-1',
        kind: 'nudge',
        actor: 'dani-id',
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('👋');
      expect(result.title).toBe('Partner nudged you');
      expect(result.body).toBe('"come do today\'s one with me 🥺"');
      expect(result.cta).toBe('play');
      expect(result.who).toBe('dani');
    });

    it('maps "milestone" kind to correct emoji/title/cta', () => {
      const activity: Activity = {
        id: 'activity-3',
        couple_id: 'couple-1',
        kind: 'milestone',
        actor: null,
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('🔥');
      expect(result.title).toBe('You hit a milestone');
      expect(result.body).toBe('Keep the streak alive.');
      expect(result.cta).toBe('streak');
      expect(result.who).toBe('us');
    });

    it('maps "refocus" kind (real producer: start_refocus, 0020) with the topic in the body', () => {
      const activity: Activity = {
        id: 'activity-refocus',
        couple_id: 'couple-1',
        kind: 'refocus',
        actor: 'user-a',
        payload: { topic: 'the dishes thing', session_id: 'sess-1' },
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('💛');
      expect(result.title).toBe('A refocus session started');
      expect(result.body).toBe('"the dishes thing" — untangling it together.');
      expect(result.cta).toBeNull();
      expect(result.who).toBe('us');
    });

    it('maps a "refocus" row without a topic payload to the generic body', () => {
      const activity: Activity = {
        id: 'activity-refocus-2',
        couple_id: 'couple-1',
        kind: 'refocus',
        actor: 'user-a',
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.body).toBe('Untangling something together.');
    });

    // 'pack' / 'reveal' have no server-side producer, so their
    // bespoke copy was removed (no dead promises). If such a row ever appears
    // they render via the generic fallback, never invented copy.
    it.each(['pack', 'reveal'])(
      'maps producer-less "%s" kind to the generic fallback',
      (kind) => {
        const activity: Activity = {
          id: `activity-${kind}`,
          couple_id: 'couple-1',
          kind,
          actor: null,
          payload: null,
          read_by: [],
          created_at: '2026-06-22T10:00:00Z',
        };

        const result = mapActivityToDisplay(activity);

        expect(result.emoji).toBe('📌');
        expect(result.title).toBe(kind);
        expect(result.body).toBe('');
        expect(result.cta).toBeNull();
        expect(result.who).toBe('us');
      }
    );

    it('maps unknown kind to generic emoji and kind as title', () => {
      const activity: Activity = {
        id: 'activity-7',
        couple_id: 'couple-1',
        kind: 'unknown_event',
        actor: null,
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('📌');
      expect(result.title).toBe('unknown_event');
      expect(result.body).toBe('');
      expect(result.cta).toBeNull();
      expect(result.who).toBe('us');
    });

    it('preserves activity id, couple_id, unread, and read_by', () => {
      const activity: Activity = {
        id: 'unique-id-123',
        couple_id: 'couple-456',
        kind: 'played',
        actor: null,
        payload: null,
        read_by: ['user-a', 'user-b'],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.id).toBe('unique-id-123');
      expect(result.kind).toBe('played');
      expect(result.unread).toBe(false);
      expect(result.read_by).toEqual(['user-a', 'user-b']);
    });

    it('case-insensitive kind matching', () => {
      const activity: Activity = {
        id: 'activity-8',
        couple_id: 'couple-1',
        kind: 'PLAYED',
        actor: null,
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.emoji).toBe('💌');
      expect(result.title).toBe('Partner played today\'s drop');
    });

    it('handles empty read_by array', () => {
      const activity: Activity = {
        id: 'activity-9',
        couple_id: 'couple-1',
        kind: 'played',
        actor: null,
        payload: null,
        read_by: [],
        created_at: '2026-06-22T10:00:00Z',
      };

      const result = mapActivityToDisplay(activity);

      expect(result.read_by).toEqual([]);
    });

    it('includes created_at in the result', () => {
      const createdAt = '2026-06-22T10:00:00Z';
      const activity: Activity = {
        id: 'activity-10',
        couple_id: 'couple-1',
        kind: 'played',
        actor: null,
        payload: null,
        read_by: [],
        created_at: createdAt,
      };

      const result = mapActivityToDisplay(activity);

      expect(result.created_at).toBe(createdAt);
    });
  });

  describe('formatActivityTime', () => {
    it('returns "just now" for less than 1 minute ago', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);

      const result = formatActivityTime(thirtySecondsAgo.toISOString());

      expect(result).toBe('just now');
    });

    it('returns "Nm ago" for minutes (e.g., 15m ago)', () => {
      const now = new Date();
      const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);

      const result = formatActivityTime(fifteenMinsAgo.toISOString());

      expect(result).toBe('15m ago');
    });

    it('returns "Nh ago" for hours (e.g., 3h ago)', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 3600000);

      const result = formatActivityTime(threeHoursAgo.toISOString());

      expect(result).toBe('3h ago');
    });

    it('returns "yesterday" for exactly 1 day ago', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000);

      const result = formatActivityTime(oneDayAgo.toISOString());

      expect(result).toBe('yesterday');
    });

    it('returns "Nd ago" for days (e.g., 4d ago)', () => {
      const now = new Date();
      const fourDaysAgo = new Date(now.getTime() - 4 * 86400000);

      const result = formatActivityTime(fourDaysAgo.toISOString());

      expect(result).toBe('4d ago');
    });

    it('returns short date format for 7+ days ago', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 86400000);

      const result = formatActivityTime(tenDaysAgo.toISOString());

      // Should be in format like "Jun 12"
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });

    it('handles 1 minute edge case', () => {
      const now = new Date();
      const oneMinAgo = new Date(now.getTime() - 60000);

      const result = formatActivityTime(oneMinAgo.toISOString());

      expect(result).toBe('1m ago');
    });

    it('handles 59 minutes edge case', () => {
      const now = new Date();
      const fiftyNineMinsAgo = new Date(now.getTime() - 59 * 60000);

      const result = formatActivityTime(fiftyNineMinsAgo.toISOString());

      expect(result).toBe('59m ago');
    });

    it('handles 1 hour edge case', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const result = formatActivityTime(oneHourAgo.toISOString());

      expect(result).toBe('1h ago');
    });

    it('handles 23 hours edge case', () => {
      const now = new Date();
      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 3600000);

      const result = formatActivityTime(twentyThreeHoursAgo.toISOString());

      expect(result).toBe('23h ago');
    });

    it('handles 2 days (not yesterday)', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);

      const result = formatActivityTime(twoDaysAgo.toISOString());

      expect(result).toBe('2d ago');
    });

    it('handles 6 days (within a week)', () => {
      const now = new Date();
      const sixDaysAgo = new Date(now.getTime() - 6 * 86400000);

      const result = formatActivityTime(sixDaysAgo.toISOString());

      expect(result).toBe('6d ago');
    });
  });
});
