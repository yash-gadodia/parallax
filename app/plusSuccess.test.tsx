import React from 'react';
import { render } from '@testing-library/react-native';
import PlusSuccessScreen from './plusSuccess';

describe('PlusSuccessScreen', () => {
  it('renders the success message with all key UI elements', async () => {
    const { getByText } = await render(<PlusSuccessScreen />);

    expect(getByText('welcome to plus')).toBeTruthy();
    expect(getByText("You're both in 💞")).toBeTruthy();
    expect(getByText('Explore the packs')).toBeTruthy();
    expect(getByText('Back to today')).toBeTruthy();
  });
});
