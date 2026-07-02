import { shouldOfferPlus, type PaywallMoment } from './paywallMoments';

const base: PaywallMoment = {
  coupleAgeDays: 5,
  hadFirstReveal: true,
  isPro: false,
  context: 'post_reveal',
};

describe('shouldOfferPlus', () => {
  it('offers Plus post-reveal for an eligible free couple', () => {
    expect(shouldOfferPlus(base)).toBe(true);
  });

  it('offers Plus on a locked-pack tap for an eligible free couple', () => {
    expect(shouldOfferPlus({ ...base, context: 'locked_pack' })).toBe(true);
  });

  it('never offers on day 0, even post-reveal', () => {
    expect(shouldOfferPlus({ ...base, coupleAgeDays: 0 })).toBe(false);
  });

  it('never offers with a negative couple age (clock skew)', () => {
    expect(shouldOfferPlus({ ...base, coupleAgeDays: -1 })).toBe(false);
  });

  it('offers from day 1 onward once revealed', () => {
    expect(shouldOfferPlus({ ...base, coupleAgeDays: 1 })).toBe(true);
  });

  it('never offers before the first mutual reveal', () => {
    expect(
      shouldOfferPlus({ ...base, coupleAgeDays: 30, hadFirstReveal: false })
    ).toBe(false);
  });

  it('never offers to a Pro member in any context', () => {
    expect(shouldOfferPlus({ ...base, isPro: true })).toBe(false);
    expect(
      shouldOfferPlus({ ...base, isPro: true, context: 'locked_pack' })
    ).toBe(false);
  });

  it('never interrupts onboarding or the daily loop', () => {
    expect(shouldOfferPlus({ ...base, context: 'onboarding' })).toBe(false);
    expect(shouldOfferPlus({ ...base, context: 'daily_loop' })).toBe(false);
  });
});
