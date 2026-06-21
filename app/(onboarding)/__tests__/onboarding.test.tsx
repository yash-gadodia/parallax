describe('Onboarding', () => {
  it('onboarding constants INTENTS has 5 items', () => {
    const { INTENTS } = require('../../../src/features/onboarding/constants');
    expect(INTENTS).toHaveLength(5);
  });

  it('onboarding constants MOMENTS has 4 items', () => {
    const { MOMENTS } = require('../../../src/features/onboarding/constants');
    expect(MOMENTS).toHaveLength(4);
  });

  it('INTENTS contains all intent types', () => {
    const { INTENTS } = require('../../../src/features/onboarding/constants');
    const ids = INTENTS.map((i: any) => i[0]);
    expect(ids).toEqual(['know', 'talk', 'rough', 'far', 'fun']);
  });

  it('MOMENTS contains all moment types', () => {
    const { MOMENTS } = require('../../../src/features/onboarding/constants');
    const ids = MOMENTS.map((m: any) => m[0]);
    expect(ids).toEqual(['morning', 'lunch', 'evening', 'bed']);
  });
});
