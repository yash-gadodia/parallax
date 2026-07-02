import React from 'react';
import { render } from '@testing-library/react-native';
import WidgetSetupScreen from '../widgetSetup';

describe('WidgetSetupScreen', () => {
  it('renders the headline and the real install instructions', async () => {
    const { getByText } = await render(<WidgetSetupScreen />);

    expect(getByText('home screen')).toBeTruthy();
    expect(getByText('See Dani all day, not just in the app.')).toBeTruthy();
    expect(getByText('live on your home screen')).toBeTruthy();

    // The honest install steps (no fake springboard demo)
    expect(getByText('long-press your home screen')).toBeTruthy();
    expect(getByText('tap + (or edit → add widget)')).toBeTruthy();
    expect(getByText('search parallax')).toBeTruthy();
    expect(
      getByText(
        'just installed the app? parallax appears in the widget list after your next app launch.'
      )
    ).toBeTruthy();
    expect(getByText('got it')).toBeTruthy();
  });
});
