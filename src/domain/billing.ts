export function getTrialEndDateString(
  trialDays: number | undefined,
  referenceDate: Date = new Date()
): string {
  if (!trialDays) {
    return 'trial ends [date]';
  }
  const endDate = new Date(referenceDate);
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
