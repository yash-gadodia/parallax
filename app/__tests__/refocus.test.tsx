import { render } from '@testing-library/react-native';
import RefocusScreen from '../(tabs)/refocus';

// ONE SIDE: the refocus tab renders the capture surface directly — the serif
// question and Speak. No intro, no pitch, and no greyed-out actions: the
// named buttons arrive with the first words.
describe('Refocus Screen (One Side)', () => {
  it('opens on capture: the question, with Speak as the only action', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <RefocusScreen />
    );
    expect(getByText('What happened?')).toBeTruthy();
    expect(getByTestId('capture-speak')).toBeTruthy();
    expect(queryByTestId('capture-read')).toBeNull();
  });
});
