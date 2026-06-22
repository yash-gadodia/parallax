import { render } from '@testing-library/react-native';
import SpiceSheet from '../spice';

describe('SpiceSheet', () => {
  it('renders the spice level options with descriptions', async () => {
    const { getByText } = await render(<SpiceSheet />);

    // Assert the title and instruction text
    expect(getByText('spice level')).toBeDefined();
    expect(
      getByText('How bold should your daily questions get? You both see the same level, and you can change it anytime.')
    ).toBeDefined();

    // Assert all three spice level options render
    expect(getByText('Sweet')).toBeDefined();
    expect(getByText('Flirty')).toBeDefined();
    expect(getByText('Spicy')).toBeDefined();

    // Assert descriptions render
    expect(getByText('Wholesome, no spice. Cozy and kind.')).toBeDefined();
    expect(getByText('A little suggestive. Tasteful heat.')).toBeDefined();
    expect(getByText('Bolder, after-dark prompts. 18+')).toBeDefined();
  });
});
