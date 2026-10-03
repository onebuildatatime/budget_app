/**
 * Free-release compatibility layer.
 *
 * Budget Buddy does not initialize an in-app purchase SDK in the free v1.
 * These exports keep older call sites safe while all purchase surfaces are
 * removed from the user experience.
 */

export type PremiumStatus = 'free' | 'premium' | 'unknown';
export type PurchaseState = 'loading' | 'ready' | 'error';
export type PremiumPackageKind = 'annual' | 'monthly' | 'other';

export type PremiumPackageOption = {
  description: string;
  highlight: string | null;
  id: string;
  kind: PremiumPackageKind;
  perMonthLabel: string | null;
  priceLabel: string;
  title: string;
};

export type PurchaseSnapshot = {
  appUserId: string | null;
  currentOfferingDescription: string | null;
  isAvailable: boolean;
  lastError: string | null;
  packages: PremiumPackageOption[];
  premiumStatus: PremiumStatus;
  purchaseState: PurchaseState;
};

const freeSnapshot: PurchaseSnapshot = {
  appUserId: null,
  currentOfferingDescription: null,
  isAvailable: false,
  lastError: null,
  packages: [],
  premiumStatus: 'free',
  purchaseState: 'ready',
};

export const getPurchaseSnapshot = () => freeSnapshot;

export const subscribeToPurchaseState = (listener: (snapshot: PurchaseSnapshot) => void) => {
  listener(freeSnapshot);
  return () => undefined;
};

export const initializePurchases = async (_userId: string | null) => freeSnapshot;
export const refreshPurchases = async () => freeSnapshot;

export const purchasePremiumPackage = async (_packageId: string): Promise<PurchaseSnapshot> => {
  throw new Error('Budget Buddy is free. No purchase is required.');
};

export const restorePremiumPurchases = async () => freeSnapshot;
export const openSubscriptionManagement = async () => undefined;
