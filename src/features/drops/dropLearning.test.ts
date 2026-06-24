import { deriveLearningFromReveal, persistDropLearning } from './dropLearning';

jest.mock('../lovemap/addLearning', () => ({
  addLearning: jest.fn(),
}));

import { addLearning } from '../lovemap/addLearning';
const mockAddLearning = addLearning as jest.Mock;

const PROMPTS = [
  { id: 'p1', emoji: '☕', question: 'I feel most taken care of when you...', options: ['bring a drink', 'handle a thing', 'check in', 'let me rant', 'sit close'] },
  { id: 'p2', emoji: '🌧', question: 'When overwhelmed, I need...', options: ['space', 'you near', 'talk it out', 'pulled out of head', 'we\'re okay'] },
  { id: 'p3', emoji: '🔓', question: 'Something I almost never say...', options: ['too much', 'not enough', 'where we\'re headed', 'a dream', 'how much I need you'] },
];

describe('deriveLearningFromReveal', () => {
  it('returns null when no prompts given', () => {
    expect(deriveLearningFromReveal([], [])).toBeNull();
  });

  it('picks the first missed prompt (youHunch !== themPick)', () => {
    const pairs = [
      { youHunch: 1, themPick: 1 }, // hit on p1
      { youHunch: 0, themPick: 3 }, // miss on p2 — first miss
      { youHunch: 1, themPick: 2 }, // miss on p3
    ];
    const result = deriveLearningFromReveal(PROMPTS, pairs);
    expect(result).not.toBeNull();
    expect(result!.emoji).toBe('🌧');
    expect(result!.need).toBe('When overwhelmed, I need...');
    expect(result!.detail).toBe('pulled out of head');
  });

  it('falls back to first prompt when all hunches hit', () => {
    const pairs = [
      { youHunch: 2, themPick: 2 },
      { youHunch: 1, themPick: 1 },
      { youHunch: 4, themPick: 4 },
    ];
    const result = deriveLearningFromReveal(PROMPTS, pairs);
    expect(result).not.toBeNull();
    expect(result!.emoji).toBe('☕');
    // pairs[0].themPick = 2 → options[2] = 'check in'
    expect(result!.detail).toBe('check in');
  });

  it('truncates question longer than 60 chars with ellipsis', () => {
    const longPrompts = [{ id: 'x', emoji: '✨', question: 'A'.repeat(70), options: ['opt0'] }];
    const pairs = [{ youHunch: 0, themPick: 0 }];
    const result = deriveLearningFromReveal(longPrompts, pairs);
    expect(result!.need.length).toBeLessThanOrEqual(60);
    expect(result!.need.endsWith('…')).toBe(true);
  });

  it('uses fallback emoji when prompt emoji is null', () => {
    const nullEmojiPrompts = [{ id: 'y', emoji: null, question: 'Q', options: ['a'] }];
    const pairs = [{ youHunch: 0, themPick: 0 }];
    const result = deriveLearningFromReveal(nullEmojiPrompts, pairs);
    expect(result!.emoji).toBe('💡');
  });
});

describe('persistDropLearning', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls addLearning with the derived params', async () => {
    mockAddLearning.mockResolvedValue('learning-1');
    const pairs = [
      { youHunch: 0, themPick: 3 }, // miss on p1
      { youHunch: 1, themPick: 1 },
      { youHunch: 2, themPick: 2 },
    ];
    await persistDropLearning({
      coupleId: 'c-1',
      aboutId: 'them-1',
      coupleDropId: 'cd-99',
      prompts: PROMPTS,
      pairs,
    });
    expect(mockAddLearning).toHaveBeenCalledWith({
      coupleId: 'c-1',
      aboutId: 'them-1',
      emoji: '☕',
      need: 'I feel most taken care of when you...',
      detail: 'let me rant',
      source: 'drop',
      origin: 'cd-99',
    });
  });

  it('does not throw when addLearning rejects (non-blocking)', async () => {
    mockAddLearning.mockRejectedValue(new Error('db failure'));
    await expect(
      persistDropLearning({
        coupleId: 'c-1',
        aboutId: 'them-1',
        coupleDropId: 'cd-99',
        prompts: PROMPTS,
        pairs: [{ youHunch: 0, themPick: 3 }],
      })
    ).resolves.toBeUndefined();
  });

  it('is a no-op when prompts list is empty', async () => {
    await persistDropLearning({
      coupleId: 'c-1',
      aboutId: 'them-1',
      coupleDropId: 'cd-99',
      prompts: [],
      pairs: [],
    });
    expect(mockAddLearning).not.toHaveBeenCalled();
  });
});
