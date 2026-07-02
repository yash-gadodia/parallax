import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const annualPkg = { identifier: '$rc_annual' } as PurchasesPackage;
const monthlyPkg = { identifier: '$rc_monthly' } as PurchasesPackage;
const lifetimePkg = { identifier: '$rc_lifetime' } as PurchasesPackage;

interface MockStore {
  offering: Partial<PurchasesOffering> | null;
  purchase: jest.Mock;
  restore: jest.Mock;
  setDemoPro: jest.Mock;
}

const mockStore: MockStore = {
  offering: null,
  purchase: jest.fn(),
  restore: jest.fn(),
  setDemoPro: jest.fn(),
};

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector: (s: MockStore) => unknown) => selector(mockStore)),
}));

import CheckoutScreen from '../checkout';

describe('CheckoutScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockStore.offering = {
      annual: annualPkg,
      monthly: monthlyPkg,
      lifetime: lifetimePkg,
    };
    mockStore.purchase.mockResolvedValue(true);
    mockStore.restore.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('renders all three plans, with the lifetime per-couple trust copy', async () => {
    const { getByText } = await render(<CheckoutScreen />);

    expect(getByText('Annual')).toBeTruthy();
    expect(getByText('$39.99')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('$4.99')).toBeTruthy();
    expect(getByText('Lifetime')).toBeTruthy();
    expect(getByText('$79.99')).toBeTruthy();
    expect(getByText('one price covers you both')).toBeTruthy();
    expect(getByText('LIFETIME')).toBeTruthy();
  });

  it('has no decorative card-entry form — RevenueCat purchase is the only path', async () => {
    const { queryByText, queryByPlaceholderText } = await render(<CheckoutScreen />);

    expect(queryByText('payment')).toBeNull();
    expect(queryByText('Card number')).toBeNull();
    expect(queryByPlaceholderText('1234  5678  9012  3456')).toBeNull();
    expect(queryByPlaceholderText('MM / YY')).toBeNull();
    expect(queryByPlaceholderText('123')).toBeNull();
  });

  it('purchases the annual package by default and routes to success', async () => {
    const { getByText } = await render(<CheckoutScreen />);

    await act(async () => {
      fireEvent.press(getByText('Start free trial'));
    });

    expect(mockReplace).toHaveBeenCalledWith('/plusSuccess');
    expect(mockStore.purchase).toHaveBeenCalledTimes(1);
    expect(mockStore.purchase).toHaveBeenCalledWith(annualPkg);
    expect(mockStore.setDemoPro).not.toHaveBeenCalled();
  });

  it('selecting lifetime swaps the CTA off the trial copy and buys the lifetime package', async () => {
    const { getByText, queryByText } = await render(<CheckoutScreen />);

    await act(async () => {
      fireEvent.press(getByText('Lifetime'));
    });

    expect(getByText('Unlock lifetime')).toBeTruthy();
    expect(getByText('$79.99 once · one price covers you both')).toBeTruthy();
    expect(queryByText('Start free trial')).toBeNull();

    await act(async () => {
      fireEvent.press(getByText('Unlock lifetime'));
    });

    expect(mockReplace).toHaveBeenCalledWith('/plusSuccess');
    expect(mockStore.purchase).toHaveBeenCalledTimes(1);
    expect(mockStore.purchase).toHaveBeenCalledWith(lifetimePkg);
  });

  it('stays on checkout when the purchase is cancelled', async () => {
    mockStore.purchase.mockResolvedValue(false);
    const { getByText } = await render(<CheckoutScreen />);

    await act(async () => {
      fireEvent.press(getByText('Start free trial'));
    });

    expect(mockStore.purchase).toHaveBeenCalledWith(annualPkg);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the honest no-charge message when the purchase throws', async () => {
    mockStore.purchase.mockRejectedValue(new Error('network'));
    const { getByText } = await render(<CheckoutScreen />);

    await act(async () => {
      fireEvent.press(getByText('Start free trial'));
    });

    expect(getByText("That didn't go through. No charge was made.")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
