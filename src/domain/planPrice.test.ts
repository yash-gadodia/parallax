import { planPrice, planPeriodLabel } from './planPrice';

// The paywall hardcoded USD strings ($39.99/yr) while StoreKit charges the
// localised price — a Singapore user read "$39.99" and was billed S$59.98.
// These map a live offering to what the user will actually be charged.
const offering = {
  annual: { product: { priceString: 'S$59.98' } },
  monthly: { product: { priceString: 'S$6.98' } },
  lifetime: { product: { priceString: 'S$109.98' } },
};

describe('planPrice', () => {
  it('returns the live StoreKit price for the annual plan', () => {
    expect(planPrice(offering, 'year', '$39.99')).toBe('S$59.98');
  });

  it('returns the live StoreKit price for the monthly plan', () => {
    expect(planPrice(offering, 'month', '$4.99')).toBe('S$6.98');
  });

  it('returns the live StoreKit price for the lifetime plan', () => {
    expect(planPrice(offering, 'life', '$79.99')).toBe('S$109.98');
  });

  it('falls back to the bundled price when there is no offering', () => {
    expect(planPrice(null, 'year', '$39.99')).toBe('$39.99');
  });

  it('falls back when the offering has no package for that plan', () => {
    expect(planPrice({ annual: null }, 'month', '$4.99')).toBe('$4.99');
  });

  it('falls back when the package carries no priceString', () => {
    expect(planPrice({ monthly: { product: {} } }, 'month', '$4.99')).toBe('$4.99');
  });

  it('falls back when priceString is an empty string', () => {
    expect(
      planPrice({ monthly: { product: { priceString: '' } } }, 'month', '$4.99'),
    ).toBe('$4.99');
  });
});

describe('planPeriodLabel', () => {
  it('labels the annual plan', () => {
    expect(planPeriodLabel('year')).toBe('/yr');
  });

  it('labels the monthly plan', () => {
    expect(planPeriodLabel('month')).toBe('/mo');
  });

  it('labels lifetime as a one-off, not a period', () => {
    expect(planPeriodLabel('life')).toBe(' once');
  });
});
