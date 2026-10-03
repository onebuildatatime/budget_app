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

- Subtitle: `A calmer monthly budget`
- Promotional text: `Plan your month, track everyday spending, and understand what is left—all without an account or subscription.`
- Keywords: `budget,budgeting,expense tracker,monthly planner,savings,finance,spending,money`

## Description draft

Budget Buddy keeps budgeting simple: set a monthly amount, build categories that match real life, and track what is left without turning the app into a spreadsheet.

Budget Buddy is free and local-first. You can create monthly budgets, add categories and subcategories, log expenses and income, tag bank accounts, review spending patterns, and import or export your data without creating an account.

Your budget stays on your device. There are no advertisements, subscriptions, or in-app purchases.

## App Store Connect checklist

1. Register the Apple Developer App ID with bundle ID `com.rahulkumar.budgetbuddy`.
2. Enable Push Notifications only if the app adds push messaging later.
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
