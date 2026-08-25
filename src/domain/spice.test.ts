import { normaliseSpiceLevel } from './spice';

describe('normaliseSpiceLevel', () => {
  it('accepts the lowercase form older rows were written with', () => {
    expect(normaliseSpiceLevel('spicy')).toBe('Spicy');
    expect(normaliseSpiceLevel('sweet')).toBe('Sweet');
  });

  it('passes the capitalised form through', () => {
    expect(normaliseSpiceLevel('Flirty')).toBe('Flirty');
  });

  it('falls back to Flirty for null, empty or unknown values', () => {
    expect(normaliseSpiceLevel(null)).toBe('Flirty');
    expect(normaliseSpiceLevel(undefined)).toBe('Flirty');
    expect(normaliseSpiceLevel('')).toBe('Flirty');
    expect(normaliseSpiceLevel('nonsense')).toBe('Flirty');
  });
});
