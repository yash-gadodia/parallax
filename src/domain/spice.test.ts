import { promptAllowedAt, filterPromptsBySpice, normaliseSpiceLevel, selectDropForSpice } from './spice';
import type { Prompt, Drop } from '../content/drop';

const makePrompt = (spice: Prompt['spice']): Prompt => ({
  id: spice,
  emoji: '❓',
  q: 'test',
  opts: ['a', 'b'],
  remy: 0,
  remyHunch: 0,
  youDemo: 0,
  youHunchDemo: 0,
  note: ['', '', ''],
  why: '',
  spice,
});

const sweetP = makePrompt('sweet');
const flirtyP = makePrompt('flirty');
const spicyP = makePrompt('spicy');

describe('promptAllowedAt', () => {
  it('Sweet level allows only sweet prompts', () => {
    expect(promptAllowedAt(sweetP, 'Sweet')).toBe(true);
    expect(promptAllowedAt(flirtyP, 'Sweet')).toBe(false);
    expect(promptAllowedAt(spicyP, 'Sweet')).toBe(false);
  });

  it('Flirty level allows sweet and flirty prompts', () => {
    expect(promptAllowedAt(sweetP, 'Flirty')).toBe(true);
    expect(promptAllowedAt(flirtyP, 'Flirty')).toBe(true);
    expect(promptAllowedAt(spicyP, 'Flirty')).toBe(false);
  });

  it('Spicy level allows all prompts', () => {
    expect(promptAllowedAt(sweetP, 'Spicy')).toBe(true);
    expect(promptAllowedAt(flirtyP, 'Spicy')).toBe(true);
    expect(promptAllowedAt(spicyP, 'Spicy')).toBe(true);
  });
});

describe('filterPromptsBySpice', () => {
  const all = [sweetP, flirtyP, spicyP];

  it('Sweet returns only sweet prompts', () => {
    const result = filterPromptsBySpice(all, 'Sweet');
    expect(result).toHaveLength(1);
    expect(result[0].spice).toBe('sweet');
  });

  it('Flirty returns sweet + flirty prompts', () => {
    const result = filterPromptsBySpice(all, 'Flirty');
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.spice)).toEqual(['sweet', 'flirty']);
  });

  it('Spicy returns all prompts', () => {
    const result = filterPromptsBySpice(all, 'Spicy');
    expect(result).toHaveLength(3);
  });
});

describe('selectDropForSpice', () => {
  const makeDrop = (prompts: Prompt[]): Drop => ({
    code: 'TEST',
    day: 'Monday',
    title: 'test',
    blurb: '',
    prompts,
  });

  it('returns a drop with only allowed prompts', () => {
    const drop = makeDrop([sweetP, flirtyP, spicyP]);
    const result = selectDropForSpice(drop, 'Sweet');
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].spice).toBe('sweet');
    expect(result.code).toBe('TEST');
  });

  it('does not mutate the original drop', () => {
    const drop = makeDrop([sweetP, flirtyP, spicyP]);
    selectDropForSpice(drop, 'Sweet');
    expect(drop.prompts).toHaveLength(3);
  });
});

describe('normaliseSpiceLevel', () => {
  it('normalises lowercase db values to capitalised UI values', () => {
    expect(normaliseSpiceLevel('sweet')).toBe('Sweet');
    expect(normaliseSpiceLevel('flirty')).toBe('Flirty');
    expect(normaliseSpiceLevel('spicy')).toBe('Spicy');
  });

  it('passes through already-capitalised values', () => {
    expect(normaliseSpiceLevel('Sweet')).toBe('Sweet');
    expect(normaliseSpiceLevel('Flirty')).toBe('Flirty');
    expect(normaliseSpiceLevel('Spicy')).toBe('Spicy');
  });

  it('falls back to Flirty for null/undefined/unknown', () => {
    expect(normaliseSpiceLevel(null)).toBe('Flirty');
    expect(normaliseSpiceLevel(undefined)).toBe('Flirty');
    expect(normaliseSpiceLevel('garbage')).toBe('Flirty');
  });
});
