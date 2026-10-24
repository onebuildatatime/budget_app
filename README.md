# Budget Buddy

A calm, local-first budgeting app for iPhone and Android, built with Expo and React Native.

## App identity

- App name: `Budget Buddy`
- Expo slug: `budget-buddy` (owner `rahul0083.be`)
- iOS bundle ID / Android package: `com.rahulkumar.budgetbuddy`
- URL scheme: `budgetbuddy`

## Features

- **Guided setup** for a monthly budget (50/30/20 starter, copy existing, or empty) or a trip/event budget with a date range.
- **Several budgets side by side**, each with its own currency. Trips can show amounts in a home currency using a rate you set.
- **Monthly plans**: income, categories grouped into Needs / Wants / Savings with targets, optional subcategory amounts.
- **Fast entry**: amount pad, category and subcategory chips, account, note, date. Transactions can repeat monthly.
- **Automatic month rollover**: when a month starts, its budget and repeating items are copied from the previous month.
- **Alerts**: an in-app banner when a category passes 85% or goes over budget, plus an optional daily reminder notification.
- **Goals**: categories or subcategories can pay into a goal automatically.
- **Trends**: spent vs planned by month, changes against last month, spending share by category, and daily spending for trips.
- **Data safety**: automatic daily backups (Files app), full backup/restore, CSV export.
- **Privacy**: no account, no servers, optional Face ID / Touch ID lock.
- Light and dark mode, and dates and numbers in the phone's locale.

## Project structure

```
App.tsx, AppNavigator.tsx   entry point, tab bar + screen stack, onboarding, lock, rollover, auto-backup
budgetModel.ts              core types and money/month helpers
src/store/                  Zustand store persisted to AsyncStorage (multi-budget aware)
src/logic/                  pure, unit-tested logic: budgets, rollover, goals, backup/CSV, trends, alerts, periods
                            + thin native wrappers (files.ts, device.ts)
src/screens/                screens and sheets
src/ui/                     design system: theme tokens, primitives, tab bar, sheets, pickers, toast
tests/                      node:test suites (`npm test`)
```

## Getting started

Prerequisites: Node.js 22.13+, npm, Xcode (for iOS builds).

```bash
npm install
npm run ios                          # build and install the development app (again after native dependency changes)
npm run start -- --dev-client        # start Metro, then open the installed Budget Buddy dev app
```

Expo Go is not used for this project. The `ios/` folder is committed with a custom startup fix, so don't regenerate it with `expo prebuild`. Edit `ios/BudgetBuddy/Info.plist` directly and run `pod install` after adding native modules.

## Checks

```bash
npm run typecheck   # TypeScript
npm test            # logic tests
npm run check       # both
```

## Release (iOS)

```bash
npm run build:ios    # EAS production build
npm run submit:ios   # upload the latest build to App Store Connect
```

Store listing text, privacy answers and the submission checklist are in [APP_STORE_METADATA.md](./APP_STORE_METADATA.md). The privacy policy and support page are [PRIVACY.md](./PRIVACY.md) and [SUPPORT.md](./SUPPORT.md). Both need hosting at public URLs for App Store Connect.

## Data and privacy

All data is stored on the device. Nothing is uploaded, and no account is needed. See [PRIVACY.md](./PRIVACY.md).
