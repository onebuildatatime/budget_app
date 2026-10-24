import {
  createId,
  inferRecurring,
  inferThemeId,
  type Category,
  type CategoryBucket,
} from '../budgetModel';

export const bucketTargets: Record<CategoryBucket, number> = { needs: 0.5, wants: 0.3, savings: 0.2 };

type TemplateItem = { name: string; bucket: CategoryBucket; share: number; subcategories: string[] };

// 50/30/20 rule: shares add up to 1.
const items: TemplateItem[] = [
  { name: 'Housing', bucket: 'needs', share: 0.25, subcategories: ['Rent or mortgage', 'Home maintenance'] },
  { name: 'Groceries', bucket: 'needs', share: 0.1, subcategories: ['Supermarket', 'Household supplies'] },
  { name: 'Utilities', bucket: 'needs', share: 0.05, subcategories: ['Electricity', 'Water', 'Internet', 'Phone'] },
  { name: 'Transport', bucket: 'needs', share: 0.05, subcategories: ['Public transport', 'Fuel', 'Car costs'] },
  { name: 'Health & Insurance', bucket: 'needs', share: 0.05, subcategories: ['Insurance', 'Pharmacy', 'Doctor'] },
  { name: 'Eating Out', bucket: 'wants', share: 0.1, subcategories: ['Restaurants', 'Takeaway', 'Coffee'] },
  { name: 'Shopping', bucket: 'wants', share: 0.08, subcategories: ['Clothing', 'Personal care', 'Gifts'] },
  { name: 'Entertainment', bucket: 'wants', share: 0.07, subcategories: ['Subscriptions', 'Hobbies', 'Going out'] },
  { name: 'Travel', bucket: 'wants', share: 0.05, subcategories: ['Trips', 'Weekend getaways'] },
  { name: 'Emergency Fund', bucket: 'savings', share: 0.1, subcategories: [] },
  { name: 'Investments', bucket: 'savings', share: 0.07, subcategories: ['Retirement', 'Index funds'] },
  { name: 'Debt Payoff', bucket: 'savings', share: 0.03, subcategories: [] },
];

export function buildTemplateCategories(income: number): Category[] {
  const categories = items.map((item, index) => ({
    id: createId('cat'),
    name: item.name,
    planned: Math.floor(income * item.share * 100) / 100,
    subcategories: item.subcategories,
    subcategoryBudgets: {},
    bucket: item.bucket,
    themeId: inferThemeId(item.name, index),
    recurring: inferRecurring(item.name),
  }));
  // Rounding leftovers go to the emergency fund so the total equals income exactly.
  const assigned = categories.reduce((sum, c) => sum + c.planned, 0);
  const emergency = categories.find((c) => c.name === 'Emergency Fund')!;
  emergency.planned = Math.round((emergency.planned + income - assigned) * 100) / 100;
  return categories;
}
