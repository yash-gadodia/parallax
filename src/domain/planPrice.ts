export type PlanId = 'year' | 'month' | 'life';

interface PricedPackage {
  product?: { priceString?: string };
}

interface PricedOffering {
  annual?: PricedPackage | null;
  monthly?: PricedPackage | null;
  lifetime?: PricedPackage | null;
}

const PACKAGE_FOR: Record<PlanId, keyof PricedOffering> = {
  year: 'annual',
  month: 'monthly',
  life: 'lifetime',
};

const PERIOD_FOR: Record<PlanId, string> = {
  year: '/yr',
  month: '/mo',
  life: ' once',
};

/**
 * What the user will actually be charged, from the live StoreKit offering.
 * Falls back to the bundled string only when there is no offering — Expo Go,
 * a failed fetch, or a plan with no package configured.
 */
export function planPrice(
  offering: PricedOffering | null | undefined,
  plan: PlanId,
  fallback: string,
): string {
  return offering?.[PACKAGE_FOR[plan]]?.product?.priceString || fallback;
}

export function planPeriodLabel(plan: PlanId): string {
  return PERIOD_FOR[plan];
}
