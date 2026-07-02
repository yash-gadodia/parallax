// Paywall placement law (IMPROVEMENT_PLAN 5.4): offer Plus only at moments of
// delight — after a mutual reveal or on a locked-pack tap. Never day-0, never
// before the first mutual reveal, never to someone who already has Plus.

export type PaywallContext =
  | 'post_reveal'
  | 'locked_pack'
  | 'onboarding'
  | 'daily_loop';

export interface PaywallMoment {
  coupleAgeDays: number;
  hadFirstReveal: boolean;
  isPro: boolean;
  context: PaywallContext;
}

const OFFER_CONTEXTS: readonly PaywallContext[] = ['post_reveal', 'locked_pack'];

export function shouldOfferPlus({
  coupleAgeDays,
  hadFirstReveal,
  isPro,
  context,
}: PaywallMoment): boolean {
  if (isPro) return false;
  if (coupleAgeDays < 1) return false;
  if (!hadFirstReveal) return false;
  return OFFER_CONTEXTS.includes(context);
}
