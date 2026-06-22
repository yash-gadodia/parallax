import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from './homeScreen';

describe('HomeScreen', () => {
  it('renders the exit pill with "Back to app" text', async () => {
    const { getByText } = await render(<HomeScreen />);
    const backButton = getByText('Back to app');
    expect(backButton).toBeTruthy();
  });

  it('renders the wave widget with "today" label', async () => {
    const { getByText } = await render(<HomeScreen />);
    const todayLabel = getByText('today');
    expect(todayLabel).toBeTruthy();
  });

  it('renders the wave widget with "Dani played 💌" text', async () => {
    const { getByText } = await render(<HomeScreen />);
    const daniPlayedText = getByText('Dani played 💌');
    expect(daniPlayedText).toBeTruthy();
  });
});
