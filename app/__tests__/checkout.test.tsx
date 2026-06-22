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

    // Verify the payment section label
    expect(getByText('payment')).toBeDefined();
  });
});
