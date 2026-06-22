import React from 'react';
import { render } from '@testing-library/react-native';
import WrappedScreen from '../wrapped';

describe('WrappedScreen', () => {
  it('renders the cover slide with title and cta text', async () => {
    const { getByText } = await render(<WrappedScreen />);

    // Assert the cover slide content is rendered
    expect(getByText('parallax · june')).toBeTruthy();
    expect(getByText(/Your month/)).toBeTruthy();
    expect(getByText('Yash & Dani · tap to begin →')).toBeTruthy();
  });
});
