import { usePurchases } from './usePurchases';

jest.mock('./client', () => ({
  loadPurchases: jest.fn(),
  ENTITLEMENT_ID: 'Parallax Pro',
  RC_IOS_KEY: 'test-ios-key',
  RC_ANDROID_KEY: 'test-android-key',
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { loadPurchases } from './client';

const mockLoadPurchases = loadPurchases as jest.Mock;

describe('usePurchases', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePurchases.setState({
      ready: false,
      isPro: false,
      offering: null,
      customerInfo: null,
    });
    jest.clearAllMocks();
  });

  describe('setDemoPro', () => {
    it('setDemoPro(true) sets isPro to true', () => {
      const { setDemoPro } = usePurchases.getState();

      expect(usePurchases.getState().isPro).toBe(false);

      setDemoPro(true);

      expect(usePurchases.getState().isPro).toBe(true);
    });

    it('setDemoPro(false) sets isPro to false', () => {
      usePurchases.setState({ isPro: true });
      const { setDemoPro } = usePurchases.getState();

      setDemoPro(false);

      expect(usePurchases.getState().isPro).toBe(false);
    });
  });

  describe('purchase', () => {
    it('demo mode (no SDK) sets isPro to true and returns true', async () => {
      mockLoadPurchases.mockReturnValue({ Purchases: null, RevenueCatUI: null });

      const { purchase } = usePurchases.getState();
      const mockPackage = { identifier: 'test-pkg' };

      const result = await purchase(mockPackage as any);

      expect(result).toBe(true);
      expect(usePurchases.getState().isPro).toBe(true);
    });

    it('with SDK: successful purchase sets isPro true when entitlement exists', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        purchasePackage: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      // Mock successful purchase with pro entitlement
      const proCustomerInfo = {
        entitlements: { active: { 'Parallax Pro': {} } },
      };
      mockPurchases.purchasePackage.mockResolvedValue({
        customerInfo: proCustomerInfo,
      });

      const { purchase } = usePurchases.getState();
      const mockPackage = { identifier: 'test-pkg' };

      const result = await purchase(mockPackage as any);

      expect(result).toBe(true);
      expect(usePurchases.getState().isPro).toBe(true);
      expect(usePurchases.getState().customerInfo).toEqual(proCustomerInfo);
    });

    it('with SDK: purchase without entitlement sets isPro false and returns false', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        purchasePackage: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      // Mock purchase response without pro entitlement
      const noproCustomerInfo = {
        entitlements: { active: {} },
      };
      mockPurchases.purchasePackage.mockResolvedValue({
        customerInfo: noproCustomerInfo,
      });

      const { purchase } = usePurchases.getState();
      const mockPackage = { identifier: 'test-pkg' };

      const result = await purchase(mockPackage as any);

      expect(result).toBe(false);
      expect(usePurchases.getState().isPro).toBe(false);
    });

    it('user cancellation returns false without throwing', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        purchasePackage: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      // Mock user cancellation
      const cancelError = new Error('User cancelled');
      (cancelError as any).userCancelled = true;
      mockPurchases.purchasePackage.mockRejectedValue(cancelError);

      const { purchase } = usePurchases.getState();
      const mockPackage = { identifier: 'test-pkg' };

      const result = await purchase(mockPackage as any);

      expect(result).toBe(false);
      expect(usePurchases.getState().isPro).toBe(false);
    });

    it('other errors are thrown', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        purchasePackage: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      const networkError = new Error('Network failed');
      mockPurchases.purchasePackage.mockRejectedValue(networkError);

      const { purchase } = usePurchases.getState();
      const mockPackage = { identifier: 'test-pkg' };

      await expect(purchase(mockPackage as any)).rejects.toThrow('Network failed');
    });
  });

  describe('configure', () => {
    it('sets ready=true in demo mode (no SDK)', async () => {
      mockLoadPurchases.mockReturnValue({ Purchases: null, RevenueCatUI: null });

      const { configure } = usePurchases.getState();

      expect(usePurchases.getState().ready).toBe(false);

      await configure();

      expect(usePurchases.getState().ready).toBe(true);
      expect(usePurchases.getState().isPro).toBe(false);
    });

    it('with SDK: calls configure and fetches customer info and offerings', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      const customerInfo = {
        entitlements: { active: { 'Parallax Pro': {} } },
      };
      const offerings = {
        current: { identifier: 'offering-1', packages: [] },
      };

      mockPurchases.getCustomerInfo.mockResolvedValue(customerInfo);
      mockPurchases.getOfferings.mockResolvedValue(offerings);

      const { configure } = usePurchases.getState();

      await configure();

      expect(mockPurchases.configure).toHaveBeenCalledWith({
        apiKey: 'test-ios-key',
      });
      expect(usePurchases.getState().ready).toBe(true);
      expect(usePurchases.getState().isPro).toBe(true);
      expect(usePurchases.getState().customerInfo).toEqual(customerInfo);
      expect(usePurchases.getState().offering).toEqual(offerings.current);
    });

    it('with SDK: handles null offering gracefully', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      const customerInfo = {
        entitlements: { active: {} },
      };
      const offerings = {
        current: null,
      };

      mockPurchases.getCustomerInfo.mockResolvedValue(customerInfo);
      mockPurchases.getOfferings.mockResolvedValue(offerings);

      const { configure } = usePurchases.getState();

      await configure();

      expect(usePurchases.getState().ready).toBe(true);
      expect(usePurchases.getState().isPro).toBe(false);
      expect(usePurchases.getState().offering).toBeNull();
    });

    it('sets ready=true even when SDK init throws', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      mockPurchases.getCustomerInfo.mockRejectedValue(new Error('SDK error'));

      const { configure } = usePurchases.getState();

      // Should not throw
      await configure();

      expect(usePurchases.getState().ready).toBe(true);
    });

    it('does not reconfigure if already ready', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      usePurchases.setState({ ready: true });

      const { configure } = usePurchases.getState();

      await configure();

      expect(mockPurchases.configure).not.toHaveBeenCalled();
    });

    it('addCustomerInfoUpdateListener updates state when called', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      mockPurchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
      mockPurchases.getOfferings.mockResolvedValue({ current: null });

      const { configure } = usePurchases.getState();
      await configure();

      // The customer-info listener registered during configure; invoke it.
      const listenerCallback = mockPurchases.addCustomerInfoUpdateListener.mock.calls[0]?.[0] as
        | ((info: unknown) => void)
        | undefined;
      const updatedInfo = { entitlements: { active: { 'Parallax Pro': {} } } };
      listenerCallback?.(updatedInfo);

      expect(usePurchases.getState().isPro).toBe(true);
      expect(usePurchases.getState().customerInfo).toEqual(updatedInfo);
    });
  });

  describe('restore', () => {
    it('demo mode (no SDK) returns current isPro value', async () => {
      mockLoadPurchases.mockReturnValue({ Purchases: null, RevenueCatUI: null });

      usePurchases.setState({ isPro: true });
      const { restore } = usePurchases.getState();

      const result = await restore();

      expect(result).toBe(true);
    });

    it('with SDK: restores purchases and updates isPro', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        restorePurchases: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      const restoredInfo = {
        entitlements: { active: { 'Parallax Pro': {} } },
      };
      mockPurchases.restorePurchases.mockResolvedValue(restoredInfo);

      const { restore } = usePurchases.getState();

      const result = await restore();

      expect(result).toBe(true);
      expect(usePurchases.getState().isPro).toBe(true);
      expect(usePurchases.getState().customerInfo).toEqual(restoredInfo);
    });

    it('with SDK: restore error returns false', async () => {
      const mockPurchases = {
        configure: jest.fn(),
        setLogHandler: jest.fn(),
        addCustomerInfoUpdateListener: jest.fn(),
        getCustomerInfo: jest.fn(),
        getOfferings: jest.fn(),
        restorePurchases: jest.fn(),
      };

      mockLoadPurchases.mockReturnValue({ Purchases: mockPurchases, RevenueCatUI: null });

      mockPurchases.restorePurchases.mockRejectedValue(new Error('Restore failed'));

      const { restore } = usePurchases.getState();

      const result = await restore();

      expect(result).toBe(false);
    });
  });

  describe('state isolation between tests', () => {
    it('can verify clean state at test start', () => {
      const state = usePurchases.getState();
      expect(state.ready).toBe(false);
      expect(state.isPro).toBe(false);
      expect(state.offering).toBeNull();
      expect(state.customerInfo).toBeNull();
    });
  });
});
