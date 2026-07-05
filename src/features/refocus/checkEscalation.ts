import type { RefocusSession } from '../../types/db';

/**
 * Check if a couple has completed 3+ refocus sessions within the last 30 days.
 * Counts only 'revealed' sessions (completed, not expired/waiting).
 */
export function checkShouldShowEscalationCard(
  sessions: RefocusSession[],
  today: Date = new Date()
): boolean {
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const revealedInWindow = sessions.filter((s) => {
    if (s.state !== 'revealed') return false;
    const createdDate = new Date(s.created_at);
    return createdDate >= thirtyDaysAgo && createdDate <= today;
  });

  return revealedInWindow.length >= 3;
}

/**
 * AsyncStorage key for tracking dismissal. Includes the count so that when the
 * couple completes more sessions and crosses a new threshold, the card re-shows.
 */
export function getDismissalKey(count: number): string {
  return `refocus-escalation-dismissed-${count}`;
}
