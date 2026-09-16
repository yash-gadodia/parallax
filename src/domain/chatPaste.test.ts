import { parseChatPaste, chatToText } from './chatPaste';

describe('parseChatPaste', () => {
  it('parses WhatsApp iOS multi-copy format', () => {
    const raw = [
      '[21:43, 16/09/2026] Dani: fine. do whatever',
      "[21:44, 16/09/2026] Yash: that's not what I said",
      '[21:44, 16/09/2026] Dani: you always say that',
    ].join('\n');
    expect(parseChatPaste(raw)).toEqual([
      { who: 'Dani', text: 'fine. do whatever' },
      { who: 'Yash', text: "that's not what I said" },
      { who: 'Dani', text: 'you always say that' },
    ]);
  });

  it('parses WhatsApp Android export format', () => {
    const raw = [
      '16/09/2026, 21:43 - Dani: forget it',
      "16/09/2026, 21:45 - Yash: I said I'd try to move it",
    ].join('\n');
    expect(parseChatPaste(raw)).toEqual([
      { who: 'Dani', text: 'forget it' },
      { who: 'Yash', text: "I said I'd try to move it" },
    ]);
  });

  it('parses plain Name: lines and folds continuations into the prior message', () => {
    const raw = ['Dani: forget it', "I'll go alone", 'Yash: wait'].join('\n');
    expect(parseChatPaste(raw)).toEqual([
      { who: 'Dani', text: "forget it\nI'll go alone" },
      { who: 'Yash', text: 'wait' },
    ]);
  });

  it('returns null for ordinary prose', () => {
    expect(
      parseChatPaste(
        'She went quiet after dinner.\nThe thing is: I knew she would.'
      )
    ).toBeNull();
  });

  it('returns null for a single line', () => {
    expect(parseChatPaste('Dani: fine')).toBeNull();
  });

  it('rejects clause-colons as senders (long "names")', () => {
    expect(
      parseChatPaste(
        'What I keep coming back to about all of it: the silence.\nAnd then nothing happened after that at all: nothing.'
      )
    ).toBeNull();
  });
});

describe('chatToText', () => {
  it('renders who-said-what lines', () => {
    expect(
      chatToText([
        { who: 'Dani', text: 'fine' },
        { who: 'Yash', text: 'wait' },
      ])
    ).toBe('Dani: fine\nYash: wait');
  });
});
