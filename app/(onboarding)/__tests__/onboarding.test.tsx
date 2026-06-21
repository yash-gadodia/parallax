describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('component file exists and exports default', () => {
    // Just verify the file can be required without errors
    const module = require('../index');
    expect(module.default).toBeDefined();
  });

  it('onboarding constants are defined correctly', () => {
    const { INTENTS, MOMENTS } = require('../../../src/features/onboarding/constants');
    
    expect(INTENTS).toHaveLength(5);
    expect(MOMENTS).toHaveLength(4);
    
    // Verify structure
    expect(INTENTS[0]).toHaveLength(3);
    expect(MOMENTS[0]).toHaveLength(4);
    
    // Check first intent and moment
    expect(INTENTS[0][0]).toBe('know');
    expect(MOMENTS[0][0]).toBe('morning');
  });

  it('INTENTS has all required items', () => {
    const { INTENTS } = require('../../../src/features/onboarding/constants');
    const ids = INTENTS.map((i: any) => i[0]);
    
    expect(ids).toContain('know');
    expect(ids).toContain('talk');
    expect(ids).toContain('rough');
    expect(ids).toContain('far');
    expect(ids).toContain('fun');
  });

  it('MOMENTS has all required items', () => {
    const { MOMENTS } = require('../../../src/features/onboarding/constants');
    const ids = MOMENTS.map((m: any) => m[0]);
    
    expect(ids).toContain('morning');
    expect(ids).toContain('lunch');
    expect(ids).toContain('evening');
    expect(ids).toContain('bed');
  });
});
