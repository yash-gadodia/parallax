import { render } from '@testing-library/react-native';
import RevealScreen from '../reveal';

describe('Reveal Screen', () => {
  it('renders the prompt and a non-empty YOU answer chip', async () => {
    const { getByText } = await render(<RevealScreen />);
    // a per-prompt compare card header
    expect(getByText('I feel most taken care of when you...')).toBeTruthy();
    // regression: the YOU chip must show a real answer, not be blank, when the
    // reveal is opened solo (demo fallback). 'low' prompt's youDemo is opts[3],
    // which only appears on the YOU side (Dani picked opts[1]).
    expect(getByText('to be pulled out of my head')).toBeTruthy();
  });
});
