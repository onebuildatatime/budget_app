# Budget Buddy (Mobile App)

Budget Buddy is a simple Expo React Native app to help users track monthly budgets by category.

## App identity

- App name: `Budget Buddy`
- Expo slug: `budget-buddy`
- Expo owner: `rahul0083.be`
- iOS bundle ID: `com.rahulkumar.budgetbuddy`
- Android package: `com.rahulkumar.budgetbuddy`
- URL scheme: `budgetbuddy`

## Features

- Set a monthly budget limit per category
- Add, edit and remove expense entries
- Add expenses from inside a category with amount, description, date, and optional subcategory
- Optionally assign part of a category budget to each subcategory and track its spent and remaining amounts
- View planned, spent, and remaining totals per category
- Monthly summary and simple charts
- Local-first storage with manual import and export

## Expense-entry design

Expense entry uses a compact receipt-style flow designed for quick mobile use. The amount sits on an open input line, followed by one grouped list with a placeholder-led description, calendar date, and single-value subcategory or account rows that reveal choices only when tapped. Repeat next month is a small checkbox, and the amount-confirming action stays fixed at the bottom of the sheet. The keyboard Done action can also save a valid entry. Opening the form from a category keeps that category and its current spent-of-planned context visible; opening it from a subcategory selects both automatically.

## Category design pattern

**Categories at a glance** is the reference pattern for category-related screens. Reuse its compact ledger rows, icon-and-name hierarchy, `amount of budget spent` wording, right-aligned remaining amount, visible progress bar, subtle dividers, and low use of separate cards. Category detail and Plan should feel like deeper versions of this same pattern, with actions kept close to the item they affect.

Subcategory budgets are optional allocations within the parent category budget. Their combined planned amounts cannot exceed the parent category amount. Existing subcategories without an allocation remain valid and show spending without a progress target.

Subcategories can be deleted from the category workspace. Deletion releases their assigned budget and removes the subcategory label from attached expenses without deleting those expenses.

## Architecture

### App Structure

![Architecture Diagram](./docs/diagrams/architecture.svg)

The app is built in three layers:
- **UI**: React Native components (Dashboard, Categories, Transactions, Settings)
- **Data**: Business logic and state management (Budgets, Transactions, Months)
- **Storage**: Local AsyncStorage with user-controlled file import and export

### Budget Workflow

![Budget Workflow](./docs/diagrams/workflow.svg)

Users follow this monthly cycle:
1. Set a budget limit for the month
2. Create budget categories (Needs, Wants, Savings)
3. Log daily expenses
4. Review spending patterns
5. Adjust if overspending
6. Roll over to next month

See the [UI and brand redesign record](./docs/UI_REDESIGN.md) and [architecture diagrams](./docs/DIAGRAMS.md) for more details.

## Getting started

Prerequisites:

- Node.js 18+ and npm
- Expo CLI (optional but recommended): `npm install -g expo-cli`

Install dependencies:

```bash
npm install
```

2. Start Expo:

   ```bash
   npm run start
   ```

3. Open on iOS/Android simulator or the Expo Go app.

## Type checking

```bash
npm run typecheck
```

## Local release checks

```bash
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-ios-check
rm -rf .expo-export-ios-check
```

## Data and privacy

- The release app stores budget data locally on the device.
- No account or subscription is required.
- Users can create manual backups through the import/export tools.
- Uninstalling the app can remove data that was not exported.

## Scripts

- `npm start` — Start the Expo development server
- `npm run android` — Run on Android emulator/device (if configured)
- `npm run ios` — Run on iOS simulator (macOS only)
- `npm run typecheck` — Run TypeScript type checks (if project uses TypeScript)

## iOS release (example)

```bash
npm run build:ios
npm run submit:ios
```

Before submitting to the App Store, ensure:

- App Store Connect app created
- App price set to Free with no in-app purchases
- App icons and screenshots prepared
- Privacy/support URLs and App Store privacy details provided

## Contributing

- [APP_STORE_METADATA.md](./APP_STORE_METADATA.md)
- [PRIVACY.md](./PRIVACY.md)
- [SUPPORT.md](./SUPPORT.md)

Contributions, bug reports and feature requests are welcome. Please open an issue or submit a PR.

## License

This project is provided under the MIT License. See LICENSE for details.
