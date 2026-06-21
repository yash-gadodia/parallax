import { render } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

describe('Today Screen', () => {
  it('renders with "Today" label', async () => {
    const { getByText } = await render(<TodayScreen />);
    expect(getByText('Today')).toBeTruthy();
  });
});
