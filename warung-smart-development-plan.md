# Warung Smart — Development Plan & Execution Guide

## 1. Project Overview

**Project:** Warung Smart  
**Type:** Mobile-first POS + inventory management app for Indonesian warung  
**Stack:** Next.js 16.3.5, React 19.2.8, TypeScript 5, Tailwind CSS v4, React Context API, lucide-react, clsx, tailwind-merge

### Main Routes

- `/jual` — POS / sales
- `/pembelian` — purchases
- `/pengeluaran` — expenses
- `/produk` — products
- `/stok` — stock
- `/hpp` — HPP / recipe builder

### Current Architecture

- No database yet.
- No backend/API persistence yet.
- Client-side state is handled through `ProductContext`.
- Mock data is used for initial application data.
- Sales and stock changes are currently ephemeral and are lost after page refresh/reload.

---

# 2. Development Workflow — IMPORTANT

Antigravity MUST follow this workflow for every future phase:

1. **Analyze only**
2. **Stop and report findings**
3. User reviews the analysis
4. User explicitly approves execution
5. Execute only the approved scope
6. Run verification
7. Report exact files changed and test results
8. User reviews again
9. Only then move to the next phase

### Rules

- Do not execute implementation during an analysis-only task.
- Do not perform unrelated refactors.
- Do not redesign existing UI unless explicitly requested.
- Do not change business logic outside the approved scope.
- Prefer the smallest safe change.
- Keep TypeScript strict.
- Do not introduce `any`.
- Keep existing architecture unless a structural change is explicitly approved.
- Always report the exact files modified.
- Always run `npx tsc --noEmit` after implementation.
- Review the final diff after implementation.

---

# 3. Completed Phase — POS Checkout

## Objective

Connect the existing `/jual` POS UI to real client-side transaction logic.

## Approved Data Model

### Sale

A sale stores transaction-level information:

- `id`
- `transactionNumber`
- `transactionDate`
- `createdAt`
- `paymentMethod`
- `totalAmount`
- `totalHpp`
- `grossProfit`
- `items`

### SaleItem

Each cart line snapshots:

- `productId`
- `productName`
- `mode`
- `quantity`
- `unit`
- `unitPrice`
- `unitHpp`
- `subtotal`
- `hppTotal`

### Important Rule

Direct and brewed entries for the same product remain separate `SaleItem` records.

For stock validation/deduction only, quantities are aggregated by `productId`.

---

## HPP Formula

The transaction HPP uses:

```ts
function calculateHPP(product: Product): number {
  if (product.hppComponents && product.hppComponents.length > 0) {
    return product.hppComponents.reduce(
      (sum, c) => sum + (c.quantity * c.unitCost),
      0
    );
  }

  return product.costPrice ?? 0;
}
```

`SaleItem.unitHpp` is calculated by `addSale`, not trusted from the POS UI.

---

## Checkout Invariants

### Revenue

```text
subtotal = quantity × unitPrice
```

### HPP

```text
hppTotal = quantity × unitHpp
```

### Gross Profit

```text
grossProfit = totalAmount - totalHpp
```

### Stock

When a sale is created:

- Validate the complete transaction first.
- Aggregate required quantity by `productId`.
- Verify stock is sufficient.
- Only after validation succeeds, deduct stock.
- Create stock log with:
  - type: `reduce`
  - reason: `penjualan`
  - aggregated quantity
  - note referencing transaction number

Never call state setters nested inside another state updater.

---

## Payment

Current checkout phase supports:

- Cash payment only.

Insufficient payment must reject the transaction.

Cart should only clear/close after successful `addSale`.

---

## POS Checkout Verification

Code review passed.

Additional minor issues were identified and fixed:

1. `CreateSaleInput` no longer requires UI to provide `unitHpp`.
2. Removed the temporary `unitHpp: 0` payload from `/jual`.
3. Added a synchronous `useRef` submit lock to prevent rapid double submission.

### Verified

`npx tsc --noEmit` passed.

Final files modified by the minor-fix phase:

- `types/warung.ts`
- `app/jual/page.tsx`
- `components/jual/payment-sheet.tsx`

---

# 4. Completed Phase — Dashboard Real Data

## Objective

Replace static Dashboard statistics with real data from the client-side sales/product/stock state.

## Dashboard Data Sources

Use:

- `sales`
- `products`
- `lowStockProducts`

from `useProductStore()`.

Do NOT add mock sales.

---

## Today's Dashboard Calculations

Today's sales are determined using the client's local date and `Sale.transactionDate`.

### Revenue

```text
today revenue = sum of Sale.totalAmount for today's sales
```

### Transactions

```text
today transactions = number of today's Sale records
```

### Gross Profit

```text
today gross profit
= sum(today Sale.totalAmount)
- sum(today SaleItem.hppTotal)
```

---

## Top Products

Aggregate SaleItems by `productId`.

Direct and brewed selling modes are combined for product-level ranking.

Ranking:

1. Highest quantity sold
2. Revenue as tie-breaker

Do not depend entirely on the current `products` array.

If a product was deleted after a sale, use the historical `SaleItem.productName` snapshot.

If there are no sales, show an appropriate empty state.

---

## Dashboard Verification

Implementation completed.

- Static `MOCK_STATS` dependency removed.
- Static `MOCK_PRODUCTS` dependency removed from Dashboard calculations.
- Dashboard now reads real sales/products/low-stock context.
- Deleted-product historical name fallback implemented.
- TypeScript check passed.
- Only `app/page.tsx` was modified for this phase.

### Status

**Dashboard Real Data = PASS at code-review level.**

---

# 5. Browser Smoke Test Status

A browser smoke test was attempted through automated Chromium/Playwright.

It was BLOCKED by the environment because Playwright could not install its browser driver:

```text
failed to install playwright:
could not install driver:
404 Not Found
https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip
```

This is an automation/environment problem, not evidence of an application bug.

Do NOT modify application code to solve this Playwright installation problem.

---

# 6. Manual Smoke Test — Completed by User

The user subsequently confirmed that the transaction flow is **done / working**.

Therefore the following areas are considered functionally verified by manual browser testing:

- POS transaction
- Checkout
- Stock deduction
- Dashboard update
- Transaction completion

---

# 7. Current Open Fix — Cart Quantity Badge

## User-Reported Issue

When selecting a product to sell, the **number of that product currently in the cart is not visible on the product tile/card**.

The underlying quantity logic is already present and working.

---

## Analysis Result

Antigravity performed analysis-only and identified the root cause.

### Root Cause

File:

```text
components/jual/product-tile.tsx
```

The product tile root `<button>` contains:

```tsx
overflow-hidden
```

The cart quantity badge is positioned:

```tsx
absolute -top-1 -right-1
```

Therefore the badge extends outside the tile boundary, but `overflow-hidden` clips it.

---

## Existing Badge

The badge already exists in `product-tile.tsx`.

The existing behavior is conceptually:

```tsx
quantityInCart > 0
```

renders the badge.

The quantity is already correctly passed through:

```text
ProductGrid
    ↓
ProductTile
    ↓
quantityInCart
```

The quantity calculation already aggregates cart entries by `productId`.

Therefore:

- business logic is correct
- cart state is correct
- quantity calculation is correct
- badge rendering exists
- only the CSS clipping is wrong

---

# 8. Approved Fix for Cart Quantity Badge

## Scope

Modify ONLY:

```text
components/jual/product-tile.tsx
```

## Required Change

Remove only:

```text
overflow-hidden
```

from the root button's className.

### Before

```tsx
'group relative flex w-full min-w-0 max-w-full flex-col items-center justify-between overflow-hidden box-border p-1 rounded-lg bg-surface border transition-all text-center select-none active:scale-95 min-h-[68px] sm:min-h-[76px]'
```

### After

```tsx
'group relative flex w-full min-w-0 max-w-full flex-col items-center justify-between box-border p-1 rounded-lg bg-surface border transition-all text-center select-none active:scale-95 min-h-[68px] sm:min-h-[76px]'
```

No other change is approved.

---

# 9. Cart Badge Expected Behavior

| State | Expected |
|---|---|
| Product not in cart | No quantity badge |
| Product added once | Badge shows `1` |
| Product quantity increased to 3 | Badge shows `3` |
| Same product in direct + brewed | Badge shows combined product quantity |
| Cart quantity changes | Badge updates immediately |

The badge should remain clearly visible at the top-right of the product tile.

---

# 10. Execution Requirements for Current Fix

Antigravity MUST:

1. Modify only `components/jual/product-tile.tsx`.
2. Remove only `overflow-hidden`.
3. Do not modify cart logic.
4. Do not modify `quantityInCart`.
5. Do not modify `getItemQuantity`.
6. Do not modify `ProductGrid`.
7. Do not redesign the product tile.
8. Do not change badge positioning/styling.
9. Do not refactor unrelated code.
10. Run:

```bash
npx tsc --noEmit
```

11. Review the final diff.
12. Confirm only the intended file changed.

---

# 11. Verification Checklist for Current Fix

After implementation, verify:

### Static verification

- [ ] `npx tsc --noEmit` passes.
- [ ] Only `components/jual/product-tile.tsx` changed.
- [ ] Diff contains only removal of `overflow-hidden`.

### Browser verification

Open:

```text
/jual
```

Then:

- [ ] Product with quantity 0 has no badge.
- [ ] Add product once → badge `1` visible.
- [ ] Increase quantity → badge updates.
- [ ] Add same product using different selling modes → badge shows combined quantity.
- [ ] Badge is not clipped.
- [ ] No product tile layout regression.
- [ ] Product name still displays correctly.
- [ ] No console/runtime error.

---

# 12. Definition of Done for Current POS + Dashboard Scope

This scope is considered CLOSED when:

### POS Checkout

- [x] Product can be added to cart.
- [x] Checkout creates Sale.
- [x] SaleItem snapshots are correct.
- [x] HPP is calculated correctly.
- [x] Gross profit is calculated correctly.
- [x] Stock is validated before deduction.
- [x] Same product across direct/brewed entries is aggregated for stock.
- [x] Stock log is created with `penjualan`.
- [x] Insufficient payment is rejected.
- [x] Cart clears only after successful transaction.
- [x] Rapid double-submit protection exists.

### Dashboard

- [x] Revenue uses real sales.
- [x] Transaction count uses real sales.
- [x] Gross profit uses real SaleItem HPP.
- [x] Product count is live.
- [x] Low-stock products are live.
- [x] Top products use real sales.
- [x] Direct/brewed quantities are combined for product ranking.
- [x] Deleted product historical name is preserved through SaleItem snapshot.
- [x] Empty sales state exists.

### Current UI Correction

- [ ] Cart quantity badge visible on product tile.
- [ ] TypeScript passes after fix.
- [ ] Manual browser verification passes.

---

# 13. Important Architectural State After This Scope

Current application is still a client-side prototype.

There is currently:

- no persistent database
- no API layer
- no authentication
- no multi-user synchronization
- no durable transaction history after refresh

Do NOT introduce database/API/auth architecture as part of small UI fixes unless explicitly requested.

---

# 14. Recommended Next Development Process

After the current cart badge fix is verified:

## Phase A — Architecture Review

Before adding many more features, analyze:

- current `ProductContext` size and responsibilities
- types consistency
- mock-data dependency
- transaction lifecycle
- stock lifecycle
- state mutation safety
- component responsibilities
- potential persistence architecture
- scalability concerns
- duplicate calculations
- error handling
- loading states
- mobile UX consistency

**Analysis only first.**

User reviews the architecture analysis before any implementation.

---

## Phase B — Persistence Planning

Only after architecture review is approved, plan persistent storage.

Possible areas to define:

- database schema
- product persistence
- stock persistence
- sales persistence
- purchase persistence
- expense persistence
- stock logs
- HPP/recipe persistence
- transaction IDs
- timestamps
- user/store ownership
- auditability
- migration strategy

Do not implement until the plan is approved.

---

## Phase C — Persistence Implementation

Implement only the approved architecture.

Priority:

1. Database/schema
2. Product persistence
3. Stock persistence
4. Sales persistence
5. Purchase/expense persistence
6. HPP/recipe persistence
7. Replace mock/client-only state gradually
8. Verification after every major phase

---

# 15. Antigravity Operating Principle

The goal is not to make the largest possible change.

The goal is:

> **Make the smallest correct change that solves the approved problem, verify it, and stop.**

When a task reveals another possible improvement:

- do not implement it automatically
- report it separately
- wait for approval

Maintain clear phase boundaries so the project does not lose direction.
