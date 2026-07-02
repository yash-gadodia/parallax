import React from 'react';
import { render } from '@testing-library/react-native';
import CheckoutScreen from '../checkout';

describe('CheckoutScreen', () => {
  it('renders the checkout screen with heading and CTA', async () => {
    const { getByText } = await render(<CheckoutScreen />);

    // Verify the CTA button renders
    expect(getByText('Start free trial')).toBeDefined();

    // Verify the "choose your plan" section label
    expect(getByText('choose your plan')).toBeDefined();

    // The honest payment story: billed through the App Store, nothing else.
    expect(
      getByText('Billed through the App Store — confirm with Face ID. Cancel anytime.')
    ).toBeDefined();

    // App Store requires a visible Restore Purchases control on the paywall
    expect(getByText('Restore purchases')).toBeDefined();
  });

  it('has no decorative card-entry form — RevenueCat purchase is the only path', async () => {
    const { queryByText, queryByPlaceholderText } = await render(<CheckoutScreen />);

    expect(queryByText('payment')).toBeNull();
    expect(queryByText('Card number')).toBeNull();
    expect(queryByPlaceholderText('1234  5678  9012  3456')).toBeNull();
    expect(queryByPlaceholderText('MM / YY')).toBeNull();
    expect(queryByPlaceholderText('123')).toBeNull();
  });
});
