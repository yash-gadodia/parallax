// The signed-in share text: a spoiler-free stat line + weekly dots, in the
// app's lowercase voice. Never includes questions or answers by design.
export function buildLiveShareMessage(args: {
  // "Alex & Jordan" (or just "Alex" while unpaired)
  names: string;
  // Server-true wavelength; null when nothing has been revealed yet.
  wave: number | null;
  streak: number;
  // weeklyDots(history) — may be empty.
  dots: string;
}): string {
  const statLine = [
    args.names,
    args.wave != null ? `${args.wave}% in sync` : null,
    args.streak > 0 ? `${args.streak}🔥` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return [statLine, args.dots || null, 'find your wavelength on parallax']
    .filter(Boolean)
    .join('\n');
}
