import { render } from '@testing-library/react-native';
import PlayScreen from '../play';

describe('Play Screen', () => {
  it('renders the first prompt with its options', async () => {
    const { getByText } = await render(<PlayScreen />);
    expect(getByText('I feel most taken care of when you...')).toBeTruthy();
    expect(getByText('bring me a drink before I ask')).toBeTruthy();
  });
});
