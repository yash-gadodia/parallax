let seq = 0;

// supabase.channel() dedupes by topic and removeChannel() unsubscribes
// asynchronously, so every subscribe needs its own topic — a remount for the
// same couple would otherwise get the still-joined channel back and .on()
// throws. Uniqueness comes from the synchronous increment, not from timing.
export function nextOnboardingChannelTopic(coupleId: string): string {
  return `onboarding-couple-${coupleId}-${++seq}`;
}
