import { render } from '@testing-library/react-native';
import RefocusScreen from '../(tabs)/refocus';

describe('Refocus Screen', () => {
  it('renders the intro step with its pitch and the start CTA', async () => {
    const { getByText, getByTestId } = await render(<RefocusScreen />);
    expect(getByText(/out of focus/)).toBeTruthy();
    expect(getByTestId('refocus-start')).toBeTruthy();
  });
});
