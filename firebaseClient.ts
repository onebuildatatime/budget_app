// Stub file - Firebase features removed for MVP

export type BudgetAuthUser = {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
};

export type PurchaseSnapshot = {
  purchaseState: 'loading' | 'ready';
  premiumStatus: 'free' | 'premium';
  packages: any[];
  lastError?: string;
};

export type PremiumPackageOption = {
  kind: 'monthly' | 'annual';
};

export type BudgetAiMonthlyReviewResponse = { text?: string };
export type BudgetAiExpenseAssistResponse = { categoryId?: string };
export type BudgetAiImportCleanupResponse = { text?: string };
export type BudgetAiMonthPlannerResponse = { text?: string };

export type MonthlyAiReview = BudgetAiMonthlyReviewResponse & {
  generatedAt: number;
};

export type ExpenseAiAssist = BudgetAiExpenseAssistResponse & {
  generatedAt: number;
};

export type ImportCleanupReview = BudgetAiImportCleanupResponse & {
  generatedAt: number;
};

export type MonthPlannerReview = BudgetAiMonthPlannerResponse & {
  generatedAt: number;
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

export const subscribeToBudgetAuth = (callback: (user: BudgetAuthUser | null) => void) => {
  callback(null);
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
export const createBudgetPasswordAccount = async () => null;
export const signInBudgetPasswordUser = async () => null;
export const signOutBudgetUser = async () => {};
export const sendBudgetPasswordReset = async () => {};
export const deleteuser = async () => {};
export const deleteBudgetUserAccount = async () => {};
export const ensureBudgetCloudUser = async () => {};
export const loadBudgetCloudState = async () => null;
export const saveBudgetCloudState = async () => {};
export const getBudgetAiMonthlyReview = async () => null;
export const getBudgetAiExpenseAssist = async () => null;
export const getBudgetAiImportCleanup = async () => null;
export const getBudgetAiMonthPlanner = async () => null;
