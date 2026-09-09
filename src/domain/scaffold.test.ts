import { composeScaffold, scaffoldReady, SlotValues } from './scaffold';

const FULL: SlotValues = {
  they: 'made a plan without checking',
  i: 'brought their family into it',
  then: 'they went quiet and left',
  hear: 'that it mattered to them too',
};

describe('composeScaffold', () => {
  it('renders every filled slot as one ordered sentence', () => {
    expect(composeScaffold(FULL, '')).toBe(
      'They made a plan without checking. Then I brought their family into it. ' +
        'Then they went quiet and left. I wanted them to say that it mattered to them too.',
    );
  });

  it('skips the clauses whose slots are empty', () => {
    expect(composeScaffold({ they: 'went quiet on me' }, '')).toBe(
      'They went quiet on me.',
    );
  });

  it('keeps the remaining clauses in order when a middle slot is empty', () => {
    expect(
      composeScaffold({ they: 'left', hear: 'sorry, plainly' }, ''),
    ).toBe('They left. I wanted them to say sorry, plainly.');
  });

  it('puts the free text after the scaffold, separated by a blank line', () => {
    expect(composeScaffold({ they: 'left' }, 'It was the JB weekend.')).toBe(
      'They left.\n\nIt was the JB weekend.',
    );
  });

  it('returns just the free text when no slot is filled', () => {
    expect(composeScaffold({}, 'It was the JB weekend.')).toBe(
      'It was the JB weekend.',
    );
  });

  it('returns an empty string when there is nothing at all', () => {
    expect(composeScaffold({}, '')).toBe('');
  });

  it('trims surrounding whitespace on the free text', () => {
    expect(composeScaffold({}, '  padded  ')).toBe('padded');
  });

  it('ignores slots that are only whitespace', () => {
    expect(composeScaffold({ they: '   ' }, 'just this')).toBe('just this');
  });
});

describe('scaffoldReady', () => {
  it('is ready on a single filled slot, with nothing typed', () => {
    expect(scaffoldReady({ they: 'left' }, '')).toBe(true);
  });

  it('is ready on typed text alone, with no slots', () => {
    expect(scaffoldReady({}, 'we argued about the dishes')).toBe(true);
  });

  it('is not ready when both are empty', () => {
    expect(scaffoldReady({}, '')).toBe(false);
  });

  it('is not ready on a couple of characters of text alone', () => {
    expect(scaffoldReady({}, 'hi')).toBe(false);
  });

  it('is ready on a chip even when the typed text is too short alone', () => {
    expect(scaffoldReady({ they: 'left' }, 'hi')).toBe(true);
  });

  it('is not ready on whitespace alone', () => {
    expect(scaffoldReady({ they: '  ' }, '   ')).toBe(false);
  });
});
