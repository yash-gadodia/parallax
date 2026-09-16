import { render } from '@testing-library/react-native';
import RefocusScreen from '../(tabs)/refocus';

// ONE SIDE: the refocus tab renders the capture surface directly — the
// question, the named Just save, and Read it. No intro, no pitch.
describe('Refocus Screen (One Side)', () => {
  it('opens on capture: the question and both named actions', async () => {
    const { getByText, getByTestId } = await render(<RefocusScreen />);
    expect(getByText('What happened?')).toBeTruthy();
    expect(getByTestId('capture-read')).toBeTruthy();
    expect(getByTestId('capture-save')).toBeTruthy();
  });
});
