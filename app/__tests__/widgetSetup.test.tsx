import React from 'react';
import { render } from '@testing-library/react-native';
import WidgetSetupScreen from '../widgetSetup';

describe('WidgetSetupScreen', () => {
  it('renders the home screen widget setup with title and main headline', async () => {
    const { getByText } = await render(<WidgetSetupScreen />);

    // Assert the TopBar title
    expect(getByText('home screen')).toBeTruthy();

    // Assert the main headline
    expect(getByText('See Dani all day, not just in the app.')).toBeTruthy();

    // Assert the kicker
    expect(getByText('live on your home screen')).toBeTruthy();

    // Assert the button text
    expect(getByText('Add to Home Screen')).toBeTruthy();
  });
});
