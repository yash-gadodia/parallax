import { checkShouldShowEscalationCard, getDismissalKey } from './checkEscalation';
import type { RefocusSession } from '../../types/db';

describe('checkShouldShowEscalationCard', () => {
  const today = new Date('2026-07-05');
  const thirtyDaysAgo = new Date('2026-06-05');
  const thirtyOneDaysAgo = new Date('2026-06-04');

  const makeSessions = (
    daysOld: number[],
    state: 'revealed' | 'waiting_partner' | 'ready' | 'expired' = 'revealed'
  ): RefocusSession[] => {
    return daysOld.map((days, idx) => {
      const date = new Date(today);
      date.setDate(date.getDate() - days);
      return {
        id: `session-${idx}`,
        couple_id: 'couple-1',
        initiator: 'initiator-1',
        topic: `topic ${idx}`,
        initiator_side: 'side',
        partner_side: 'side',
        state,
        ai_result: null,
        created_at: date.toISOString(),
        partner_joined_at: null,
        revealed_at: date.toISOString(),
      };
    });
  };

  it('returns false when fewer than 3 sessions in 30 days', () => {
    const sessions = makeSessions([0, 15]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(false);
  });

  it('returns true when exactly 3 sessions in 30 days', () => {
    const sessions = makeSessions([0, 15, 28]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(true);
  });

  it('returns true when more than 3 sessions in 30 days', () => {
    const sessions = makeSessions([0, 7, 14, 21]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(true);
  });

  it('ignores sessions older than 30 days', () => {
    const sessions = makeSessions([0, 15, 32]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(false);
  });

  it('ignores sessions that are not revealed', () => {
    const sessions = [
      ...makeSessions([0, 15, 28], 'revealed'),
      ...makeSessions([5], 'waiting_partner'),
    ];
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(true);
  });

  it('returns false when no sessions', () => {
    const sessions: RefocusSession[] = [];
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(false);
  });

  it('counts sessions at exactly 30 days', () => {
    const sessions = makeSessions([0, 15, 30]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(true);
  });

  it('ignores sessions just over 30 days', () => {
    const sessions = makeSessions([0, 15, 31]);
    expect(checkShouldShowEscalationCard(sessions, today)).toBe(false);
  });
});

describe('getDismissalKey', () => {
  it('returns a consistent key based on count', () => {
    const key1 = getDismissalKey(3);
    const key2 = getDismissalKey(3);
    expect(key1).toBe(key2);
  });

  it('returns different keys for different counts', () => {
    const key3 = getDismissalKey(3);
    const key4 = getDismissalKey(4);
    expect(key3).not.toBe(key4);
  });

  it('formats key properly', () => {
    const key = getDismissalKey(3);
    expect(key).toMatch(/^refocus-escalation/);
    expect(key).toContain('3');
  });
});
