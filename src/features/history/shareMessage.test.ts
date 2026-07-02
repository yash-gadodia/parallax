import { buildLiveShareMessage } from './shareMessage';

describe('buildLiveShareMessage', () => {
  it('composes names · wave · streak, then the dots, then the tagline', () => {
    expect(
      buildLiveShareMessage({ names: 'Alex & Jordan', wave: 84, streak: 7, dots: '🟢🟢🟡' })
    ).toBe('Alex & Jordan · 84% in sync · 7🔥\n🟢🟢🟡\nfind your wavelength on parallax');
  });

  it('omits the streak segment when the streak is 0', () => {
    expect(
      buildLiveShareMessage({ names: 'Alex & Jordan', wave: 84, streak: 0, dots: '🟢🟢🟡' })
    ).toBe('Alex & Jordan · 84% in sync\n🟢🟢🟡\nfind your wavelength on parallax');
  });

  it('omits the wave segment when nothing has been revealed yet', () => {
    expect(buildLiveShareMessage({ names: 'Alex & Jordan', wave: null, streak: 3, dots: '' })).toBe(
      'Alex & Jordan · 3🔥\nfind your wavelength on parallax'
    );
  });

  it('drops the dots line entirely when there is no history', () => {
    expect(buildLiveShareMessage({ names: 'Alex', wave: 62, streak: 0, dots: '' })).toBe(
      'Alex · 62% in sync\nfind your wavelength on parallax'
    );
  });
});
