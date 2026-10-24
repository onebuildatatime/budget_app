# Budget Buddy iOS Launch Metadata

## App identity

- App name: `Budget Buddy`
- Expo slug: `budget-buddy`
- Expo owner: `rahul0083.be`
- Bundle identifier: `com.rahulkumar.budgetbuddy`
- Android package: `com.rahulkumar.budgetbuddy`
- URL scheme: `budgetbuddy`
- SKU: `com.rahulkumar.budgetbuddy`
- Primary category: `Finance`
- Pricing model: `Free`

## Store listing draft

- Subtitle: `Budgets for months and trips`
- Promotional text: `Plan your month with the 50/30/20 rule, budget trips in any currency, and log spending in a few taps. No account, no ads.`
- Keywords: `budget,50/30/20,expense tracker,travel budget,trip,savings goals,spending,money,planner`

## Description draft

Budget Buddy gives every euro, dollar or yen a job, without turning your life into a spreadsheet.

START IN A MINUTE
Choose a monthly budget and start from the 50/30/20 rule (half on needs, 30% on wants, 20% on savings), or plan a trip or event with one total for a set of dates. Every category is yours to rename, resize or split into subcategories.

TRACK IN A FEW TAPS
Tap +, type the amount, pick a category. Mark rent and bills as repeating and they carry into next month automatically. Budget Buddy tells you how much is left, how much you can spend per day, and warns you when a category is nearly used up.

BUDGETS SIDE BY SIDE
Keep your everyday budget and a trip budget in different currencies, and switch with one tap. Trip budgets can show amounts in your home currency too.

SAVE FOR WHAT MATTERS
Set goals and link them to your savings categories so they fill up as you log transfers. Trends show spending by month and what changed from last month.

PRIVATE BY DESIGN
No account, no ads, no tracking. Your data stays on your phone, with automatic daily backups, Face ID lock, full backup and restore, and CSV export.

## App Privacy answers

- Data collection: **Data Not Collected**
- Tracking: **No**
- Local notifications only (no push entitlement needed); Face ID handled by iOS.

## Review notes draft

Budget Buddy needs no account or sign-in. On first launch tap "Create my first budget", choose "Monthly budget", enter any income and continue. Face ID lock is optional (Menu → Preferences). Reminders are local notifications.

## App Store Connect checklist

1. Register the Apple Developer App ID with bundle ID `com.rahulkumar.budgetbuddy`.
2. Push Notifications capability is not needed: reminders are local notifications.
3. Create the app in App Store Connect with name `Budget Buddy`, bundle ID `com.rahulkumar.budgetbuddy`, and SKU `com.rahulkumar.budgetbuddy`.
4. Set the app price to `Free` and leave in-app purchases empty.
5. Point App Store Connect support/privacy URLs to hosted versions of [SUPPORT.md](./SUPPORT.md) and [PRIVACY.md](./PRIVACY.md).
6. Complete the App Privacy questionnaire using the local-only data handling described in the privacy policy.
7. Upload final iPhone screenshots, the 1024×1024 icon, and review notes before submission.

## Build and submit commands

```bash
npm exec --yes --cache /tmp/npm-cache-eas-build -- eas-cli build --platform ios --profile production --clear-cache
```

```bash
npm exec --yes --cache /tmp/npm-cache-eas-submit -- eas-cli submit --platform ios --profile production --latest --wait --verbose
```

## Local release checks

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-ios-check
rm -rf .expo-export-ios-check
```
