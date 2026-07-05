import { create } from 'zustand';
import { Platform } from 'react-native';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  loadPurchases,
  ENTITLEMENT_ID,
  RC_IOS_KEY,
  RC_ANDROID_KEY,
} from './client';

function hasPro(info: CustomerInfo | null): boolean {
  return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
}

interface PurchasesState {
  ready: boolean;
  /** Source of truth for Plus everywhere (RevenueCat "Parallax Pro" entitlement). */
  isPro: boolean;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  /** Call once at app start. */
  configure: () => Promise<void>;
  /** Buy a package; resolves true if it unlocked Plus. */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore prior purchases; resolves to the resulting Plus status. */
  restore: () => Promise<boolean>;
  /** Demo/Expo-Go fallback so the scripted Plus flow still works without the SDK. */
  setDemoPro: (value: boolean) => void;
}

export const usePurchases = create<PurchasesState>((set, get) => ({
  ready: false,
  isPro: false,
  offering: null,
  customerInfo: null,

  configure: async () => {
    if (get().ready) return;
    const { Purchases } = loadPurchases();
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY || RC_IOS_KEY;
    // Expo Go or no key → demo mode (isPro driven locally by setDemoPro/purchase).
    if (!Purchases || !apiKey) {
      set({ ready: true });
      return;
    }
    try {
      // RevenueCat routes its own diagnostics through console.error at ERROR level,
      // which RN LogBox surfaces as a fatal red screen. In dev the Test Store key has
      // no products registered (payments are gated), so that diagnostic is expected
      // noise — keep it visible in the JS console, but never as a red-box "error".
      Purchases.setLogHandler((level, message) => {
        console.log(`[RevenueCat] ${level}: ${message}`);
      });
      Purchases.configure({ apiKey });
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        set({ customerInfo: info, isPro: hasPro(info) });
      });
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      set({
        ready: true,
        customerInfo: info,
        offering: offerings.current ?? null,
        isPro: hasPro(info),
      });
    } catch {
      set({ ready: true });
    }
  },

  purchase: async (pkg: PurchasesPackage) => {
    const { Purchases } = loadPurchases();
    if (!Purchases) {
      // demo: unlock locally so the in-app Checkout flow still works in Expo Go.
      set({ isPro: true });
      return true;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const pro = hasPro(customerInfo);
      set({ customerInfo, isPro: pro });
      return pro;
    } catch (e) {
      // user cancelling is not an error worth surfacing
      const cancelled = (e as { userCancelled?: boolean })?.userCancelled;
      if (!cancelled) throw e;
      return false;
    }
  },

  restore: async () => {
    const { Purchases } = loadPurchases();
    if (!Purchases) return get().isPro;
    try {
      const info = await Purchases.restorePurchases();
      const pro = hasPro(info);
      set({ customerInfo: info, isPro: pro });
      return pro;
    } catch {
      return false;
    }
  },

  setDemoPro: (value: boolean) => set({ isPro: value }),
}));

// ── RevenueCat UI: hosted Paywall + Customer Center ────────────────────────────
// Both no-op (return false / nothing) when the SDK isn't present, so callers can
// fall back to the in-app Checkout / ManageSub screens in Expo Go.

export async function presentPaywall(): Promise<boolean> {
  const { RevenueCatUI } = loadPurchases();
  if (!RevenueCatUI) return false;
  try {
    const result = await RevenueCatUI.presentPaywall();
    const unlocked = result === 'PURCHASED' || result === 'RESTORED';
    if (unlocked) await usePurchases.getState().restore();
    return unlocked;
  } catch {
    return false;
  }
}

export async function presentPaywallIfNeeded(): Promise<boolean> {
  const { RevenueCatUI } = loadPurchases();
  if (!RevenueCatUI) return usePurchases.getState().isPro;
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    await usePurchases.getState().restore();
    return result === 'PURCHASED' || result === 'RESTORED' || usePurchases.getState().isPro;
  } catch {
    return false;
  }
}

export async function presentCustomerCenter(): Promise<void> {
  const { RevenueCatUI } = loadPurchases();
  if (!RevenueCatUI) return;
  try {
    await RevenueCatUI.presentCustomerCenter();
    await usePurchases.getState().restore();
  } catch {
    // swallow - managing the sub should never crash the screen
  }
}
