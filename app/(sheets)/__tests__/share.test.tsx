import React from 'react';
import { render } from '@testing-library/react-native';
import ShareSheet from '../share';

describe('ShareSheet', () => {
  it('renders the share sheet with title and content', async () => {
    const { getByText } = await render(<ShareSheet />);

    // Assert the sheet title is rendered
    expect(getByText('share via')).toBeTruthy();

    // Assert the "on the same wavelength" text is rendered
    expect(getByText('on the same wavelength')).toBeTruthy();

    // Assert the share buttons are rendered
    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('Instagram')).toBeTruthy();
    expect(getByText('Copy')).toBeTruthy();
  });
});
