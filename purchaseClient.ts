// Stub file - Purchase features removed for MVP

export type PurchaseSnapshot = {
  purchaseState: 'loading' | 'ready';
  premiumStatus: 'free' | 'premium';
  packages: any[];
  lastError?: string;
};

export type PremiumPackageOption = {
  kind: 'monthly' | 'annual';
};

export const getPurchaseSnapshot = (): PurchaseSnapshot => ({
  purchaseState: 'ready',
  premiumStatus: 'free',
  packages: [],
});

export const subscribeToPurchaseState = (callback: (snapshot: PurchaseSnapshot) => void) => {
  callback(getPurchaseSnapshot());
  return () => {};
};

export const initializePurchases = async (): Promise<PurchaseSnapshot> => ({
  purchaseState: 'ready',
  premiumStatus: 'free',
  packages: [],
});

export const openSubscriptionManagement = async () => {};
export const purchasePremiumPackage = async () => {};
export const restorePremiumPurchases = async () => {};
