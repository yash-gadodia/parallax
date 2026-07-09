import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import LegalLinks from './LegalLinks';
import { LEGAL } from '../lib/links';

jest.mock('react-native/Libraries/Linking/Linking');

describe('LegalLinks', () => {
  beforeEach(() => {
    (Linking.openURL as jest.Mock).mockClear();
  });

  it('renders both required legal links', async () => {
    const { getByText } = await render(<LegalLinks />);
    expect(getByText('Terms of Use')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('opens the hosted Terms of Use (EULA) URL', async () => {
    const { getByText } = await render(<LegalLinks />);
    fireEvent.press(getByText('Terms of Use'));
    expect(Linking.openURL).toHaveBeenCalledWith(LEGAL.terms);
    expect(LEGAL.terms).toBe('https://yash-gadodia.github.io/parallax/legal/terms.html');
  });

  it('opens the hosted Privacy Policy URL', async () => {
    const { getByText } = await render(<LegalLinks />);
    fireEvent.press(getByText('Privacy Policy'));
    expect(Linking.openURL).toHaveBeenCalledWith(LEGAL.privacy);
    expect(LEGAL.privacy).toBe('https://yash-gadodia.github.io/parallax/legal/privacy.html');
  });
});
