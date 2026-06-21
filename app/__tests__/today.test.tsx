import { render } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

describe('Today Screen', () => {
  it('renders the daily-drop home without crashing', async () => {
    const { toJSON } = await render(<TodayScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
