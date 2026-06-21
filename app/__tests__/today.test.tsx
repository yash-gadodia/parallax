import { render } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

describe('Today Screen', () => {
  it('renders the daily drop and the play CTA', async () => {
    const { getByText } = await render(<TodayScreen />);
    expect(getByText('soft launch')).toBeTruthy();
    expect(getByText("Play today's three")).toBeTruthy();
  });
});
