# Navigation Guide

## Screen Flows

### Dashboard (Home Screen)
**Entry point** - Shows budget overview and key metrics

```
┌─────────────────────────────────────┐
│  Month Selector  [Nov 2026]          │
├─────────────────────────────────────┤
│  Hero: €3,296.84 Income              │
│  100% allocated                      │
├─────────────────────────────────────┤
│  [Planned] [Spent] [Remaining]       │
├─────────────────────────────────────┤
│  Spending Progress Bar               │
│  70% of budget allocated             │
├─────────────────────────────────────┤
│  Budget Breakdown (Top 5 categories) │
│  • Fixed & Recurring: €956.41 (91%)  │
│  • Household: €500 (80%)             │
│  • Lifestyle & Flex: €425 (0%)       │
│  [Edit →]                           │
├─────────────────────────────────────┤
│  Savings Goals (Top 3)               │
│  • Emergency Fund: €962.67 (17%)     │
│  • India Trip: €0 (0%)               │
│  • Styling: €200 (20%)               │
│  [All →]                            │
├─────────────────────────────────────┤
│  [+ Add Transaction]                 │
│  [View Transactions]                 │
└─────────────────────────────────────┘
```

**From Dashboard, navigate to:**
- `Edit →` → Budget Editor
- `All →` → Savings Goals
- `+ Add Transaction` → Add Transaction
- `View Transactions` → Transactions List
- Month arrows → navigate months

---

### Budget Editor
**Edit monthly allocations** - Adjust how much to spend per category

```
┌─────────────────────────────────────┐
│  [← Back]  November 2026             │
├─────────────────────────────────────┤
│  Income:        €3,296.84            │
│  Allocated:     €3,296.84            │
│  Remaining:     €0.00 ✓              │
├─────────────────────────────────────┤
│  Fixed & Recurring                   │
│  Budget: [  956.41  ] €              │
│  • Rent, Electricity, Transport...   │
├─────────────────────────────────────┤
│  Household                           │
│  Budget: [  500.00  ] €              │
│  • Groceries, Cleaning, IKEA...      │
├─────────────────────────────────────┤
│  Lifestyle & Flex                    │
│  Budget: [  425.00  ] €              │
│  • Eating Out, Shopping, Buffer...   │
├─────────────────────────────────────┤
│  [more categories below...]          │
├─────────────────────────────────────┤
│  [Save Budget]  (enabled when 100%)  │
└─────────────────────────────────────┘
```

**Actions:**
- Edit amount in each field
- System calculates remaining balance in real-time
- Save enabled only when total = income
- Back to Dashboard

---

### Add Transaction
**Record a spending or income event**

```
┌─────────────────────────────────────┐
│  [← Back]  Add Transaction           │
├─────────────────────────────────────┤
│  [Expense] [Income]                  │
├─────────────────────────────────────┤
│  Amount                              │
│  [         75.50  ] €                │
├─────────────────────────────────────┤
│  Date                                │
│  [Oct 24, 2026]                  📅  │
├─────────────────────────────────────┤
│  Category (if Expense)               │
│  [Household]                         ▼ │
│  (Opens modal to pick category)      │
├─────────────────────────────────────┤
│  Account                             │
│  [Revolut]                           ▼ │
│  (Opens modal to pick account)       │
├─────────────────────────────────────┤
│  Note (optional)                     │
│  [Groceries at Delhaize...]          │
├─────────────────────────────────────┤
│  [Add Expense]                       │
└─────────────────────────────────────┘

On save → Confirmation dialog:
"Added €75.50 to Household"
[Add another] [Done]
```

**Actions:**
- Toggle Expense/Income
- Pick date (date picker)
- Pick category from modal
- Pick account from modal
- Add note
- Submit transaction
- Optionally add another or return to Dashboard

---

### Transactions List
**View and manage all transactions in a month**

```
┌─────────────────────────────────────┐
│  [← Back]  Transactions  [+ Add]     │
├─────────────────────────────────────┤
│  [Nov 2026] ← Month → (also shows ▶) │
├─────────────────────────────────────┤
│  [Recent] [Highest]  (sort options)  │
├─────────────────────────────────────┤
│  Household              €75.50       │
│  Groceries at Delhaize              │
├─────────────────────────────────────┤
│  Fixed & Recurring      €956.41      │
│  Monthly rent transfer              │
├─────────────────────────────────────┤
│  Lifestyle & Flex       €25.00       │
│  Coffee at Nero                     │
├─────────────────────────────────────┤
│  [more transactions...]              │
└─────────────────────────────────────┘

Long-press any transaction → Delete confirmation
```

**Actions:**
- Navigate months (arrows)
- Sort by Recent or Highest
- Long-press to delete
- Tap + Add to add new transaction
- Back to Dashboard

---

### Savings Goals
**Track progress on your 10 savings goals**

```
┌─────────────────────────────────────┐
│  [← Back]  Savings Goals             │
├─────────────────────────────────────┤
│  Total Progress                      │
│  €1,162.67 of €11,646.50             │
│  [████░░░░░░░░░░░░░░░░░░░]           │
│  10% complete                        │
├─────────────────────────────────────┤
│  Emergency Fund                      │
│  [████████████░░░░░░░░░]             │
│  €962.67 of €5,500 | 17% | ✓ Tap    │
├─────────────────────────────────────┤
│  India Trip                          │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░]         │
│  €0 of €1,000 | 0% | ✓ Tap          │
├─────────────────────────────────────┤
│  Spa Getaway                         │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░]         │
│  €0 of €450 | 0% | ✓ Tap            │
├─────────────────────────────────────┤
│  [more goals...]                     │
└─────────────────────────────────────┘

Tap any goal → Modal opens:
┌─────────────────────────────────────┐
│  Emergency Fund                  [✕] │
├─────────────────────────────────────┤
│  Current: €962.67                   │
│  Amount: [      100.00 ] €           │
├─────────────────────────────────────┤
│  [Add Contribution] [Withdraw]       │
└─────────────────────────────────────┘
```

**Actions:**
- View all 10 goals with progress bars
- Sorted by lowest progress first
- Overall progress card at top
- Tap goal to open contribution/withdrawal modal
- Back to Dashboard

---

## Navigation Routes

```
Dashboard (entry point)
├── "Edit" → BudgetEditor → Back → Dashboard
├── "All" → GoalsScreen → Back → Dashboard
├── "+ Add" → AddTransaction → Done → Dashboard
├── "View" → TransactionsScreen
│   ├── "+" → AddTransaction → Done → TransactionsScreen
│   └── Back → Dashboard
└── Month arrows → Stay on Dashboard (different month)

AddTransaction (from Dashboard or Transactions)
├── "Back" → Dashboard or TransactionsScreen
├── Save → Confirmation → [Add another] or [Done]
└── [Done] → Dashboard

TransactionsScreen (from Dashboard)
├── "← Back" → Dashboard
├── "+" → AddTransaction → Done → TransactionsScreen
└── [Recent/Highest] → Sort in place

GoalsScreen
├── "← Back" → Dashboard
├── Tap goal → Contribution Modal
│   ├── "Add Contribution" → Update → Modal closes
│   └── "Withdraw" → Update → Modal closes
└── Modal [✕] → Close
```

## Full Navigation Tree

```
┌─────────────────────────────────────┐
│        Dashboard (HOME)              │
│  (Month navigation, budget overview) │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Budget Editor                   ││
│  │ (Edit allocations)              ││
│  │ Save → Back to Dashboard        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Add Transaction                 ││
│  │ (Enter expense/income)          ││
│  │ → Transactions List or Dashboard││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Transactions List               ││
│  │ (View, sort, delete)            ││
│  │ ├─ Month navigation             ││
│  │ ├─ Sort (Recent/Highest)        ││
│  │ └─ Add transaction link         ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Savings Goals                   ││
│  │ (Track progress)                ││
│  │ ├─ Goal card (tap to edit)      ││
│  │ └─ Contribution modal           ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Key Features by Screen

| Screen | Purpose | Key Action |
|--------|---------|-----------|
| Dashboard | Overview | Navigate months, jump to features |
| Budget Editor | Plan | Allocate money to categories |
| Add Transaction | Record | Save spending/income event |
| Transactions | Review | See what you spent, sort/delete |
| Savings Goals | Track | Monitor goal progress, add savings |

All data syncs automatically to device storage.
