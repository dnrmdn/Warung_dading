# Warung App — Post-Migration Execution Roadmap

## Purpose

This document is the execution roadmap after the Product/Sales migration and legacy mock dependency cleanup.

The roadmap combines:

- Completed migration phases
- Production readiness and security hardening
- Sales transaction history
- Customer receivables / debt (piutang)
- Business report UI cleanup
- Final regression audit

---

# 1. Completed Phases

The following phases are completed and should **not be repeated unless a later audit finds a regression**.

| Phase | Scope | Status |
|---|---|---|
| 2C.1 | `/jual` DB-backed migration | ✅ PASS |
| 2C.2 | `/pembelian/baru` DB-backed migration | ✅ PASS |
| 2C.3 | `/stok` DB-backed migration | ✅ PASS |
| 2C.4 | `/produk/[id]` + `/hpp/[id]` DB-backed migration | ✅ PASS |
| 2C.5 | Retire `ProductContext` | ✅ PASS |
| 2D | Retire `SalesContext` | ✅ PASS |
| 2E | Full legacy mock dependency audit | ✅ PASS |
| 2F | E2E business flow audit | ✅ PASS WITH ISSUES |
| 2G.1 | Authentication & Authorization Audit | ✅ PASS |
| 2G.1-E | Better Auth & RBAC Implementation | ✅ PASS |

## Important Existing Architecture

Production runtime is now DB-backed.

- Product runtime data comes from Prisma/services/server actions.
- Sales runtime data comes from Prisma/services/server actions.
- Purchase runtime data comes from Prisma/services/server actions.
- `ProductContext` has been removed.
- `SalesContext` has been removed.
- Legacy mock data remains only for Prisma seed purposes.
- `lib/mock/warung-data.ts` must remain unless a future approved task explicitly changes the seed architecture.
- Canonical product IDs are Prisma UUIDs.
- Do not reintroduce slug-based runtime mapping or client-side mock state.

---

# 2. Phase 2G — Production Readiness & Security Hardening

## 2G.1 — Authentication & Authorization Audit

**Status: ✅ PASS (Audit Completed)**

**Mode: ANALYSIS ONLY**

### Audit Summary

The 2G.1 security audit confirmed:
- Zero authentication and zero authorization currently exist in the codebase.
- No auth libraries, no middleware, and no User/Session models exist in Prisma.
- All Server Actions under `app/actions/**` are directly invocable without any authentication or authorization guards.

---

## 2G.1-E — Authentication & Authorization Implementation

**Status: ✅ PASS (IMPLEMENTED & VERIFIED)**

Implemented using Better Auth with email + password, database sessions, ADMIN / OWNER RBAC, server-authoritative `isActive` check, Server Action guards on all 24 actions, and server-side page guards. All 11 automated security tests pass with 0 errors.

### Requirements & Architecture

Warung App is a **multi-user application with role-based access control (RBAC)**.

The application requires:
- User accounts and login/logout flow
- Secure session management and user identity
- Role-based authorization enforced server-side
- Route protection (unauthenticated users redirected to `/login`)
- Server Action protection against direct invocation
- Standardized `UNAUTHORIZED` response when authentication or authorization fails
- UI-level role-based visibility (note: UI visibility is **not** a security boundary; server enforcement is mandatory)

The architecture must use a proper authentication/session library compatible with the existing Next.js (16 App Router) + Prisma + PostgreSQL stack rather than ad-hoc authentication from scratch. The exact authentication library must be determined during Phase 2G.1-E planning after inspecting the current project.

### Finalized Role Model

There are exactly two initial roles:
- `ADMIN`
- `OWNER`

#### ADMIN
- Full access to all application features and operational flows.
- Can access: Dashboard, Jual / Kasir, Stok, Produk, HPP, Pembelian, Pengeluaran, Supplier, Laporan.
- Authorized to perform all currently supported mutations and Server Actions.

#### OWNER
- **Report-only role.**
- Can access: Laporan.
- Must **NOT** have access to:
  - Dashboard operational features
  - Jual / Kasir
  - Stok
  - Produk
  - HPP
  - Pembelian
  - Pengeluaran
  - Supplier
  - Any mutation Server Action
- OWNER must only be authorized to read/reporting functionality explicitly allowed for the OWNER role.
- OWNER must never be able to bypass restrictions by manually invoking an action or navigating directly to a protected route.

#### Unauthenticated Users
- Can access `/login`.
- Must be redirected to `/login` when attempting to access protected application routes.
- Must not be able to invoke protected Server Actions.
- Must receive a standardized `UNAUTHORIZED` response when authentication is required.

### Finalized Route & Feature Authorization Matrix

| Feature / Route | ADMIN | OWNER | Unauthenticated |
| --------------- | :---: | :---: | :---: |
| `/login`        |   ✅   |   ✅   |       ✅        |
| Dashboard (`/`) |   ✅   |   ❌   |  Redirect `/login` |
| Jual / Kasir (`/jual`) | ✅ | ❌ | Redirect `/login` |
| Stok (`/stok`)  |   ✅   |   ❌   |  Redirect `/login` |
| Produk (`/produk/**`) | ✅ | ❌ | Redirect `/login` |
| HPP (`/hpp/**`) |   ✅   |   ❌   |  Redirect `/login` |
| Pembelian (`/pembelian/**`) | ✅ | ❌ | Redirect `/login` |
| Pengeluaran (`/pengeluaran/**`) | ✅ | ❌ | Redirect `/login` |
| Supplier (`/supplier/**`) | ✅ | ❌ | Redirect `/login` |
| Laporan (`/laporan/**`) | ✅ | ✅ | Redirect `/login` |

### Server Action Security Rules
- Route protection is required, but route protection alone is not sufficient.
- Server Action authorization is required on all Server Actions.
- Direct Server Action invocation must enforce both authentication and role authorization.
- Any unauthorized direct invocation (e.g., OWNER calling `createSaleAction` or `adjustStockAction`) must fail server-side with an authorization error.

### Important Scope Rule: Single-Warung Architecture
- **Do NOT introduce multi-tenant architecture.**
- The application remains a single Warung/business database.
- The authentication system is multi-user, but the business data remains shared by users within the same Warung.
- Do not add `tenantId` unless another existing roadmap requirement explicitly requires it.

### Classification

#### MUST
- Implement real user authentication.
- Implement secure session management.
- Implement `ADMIN` and `OWNER` roles.
- Protect all application routes.
- Protect all sensitive Server Actions.
- Enforce role authorization server-side.
- Standardize unauthorized/forbidden responses.
- Ensure OWNER is report-only.
- Add login/logout flow.
- Prevent unauthenticated direct Server Action invocation.
- Prevent OWNER from invoking ADMIN-only mutations.

#### SHOULD
- Add active/inactive user state.
- Add basic session expiration handling.
- Add centralized authorization helpers.
- Keep authorization logic reusable and centralized.
- Add automated/manual authorization verification.

#### LATER (Future Scope)
- More granular permissions.
- Additional roles.
- Multi-tenant support.
- Per-user ownership of business records.
- User activity/audit attribution.

### Phase 2G.1-E Planning Constraint
- **PLAN ONLY BEFORE IMPLEMENTATION:** Produce and obtain approval for the detailed implementation plan (including auth library selection, schema migration design, and server guard mechanics) before modifying code.

### Verification
Run:
- TypeScript check (`npx tsc --noEmit`): ✅ PASS (0 errors)
- Targeted ESLint (`lib/auth`, `app/login`, `app/actions`, `scripts/security-test.ts`, `middleware.ts`): ✅ PASS (0 errors, 0 warnings)
- Direct unauthenticated mutation tests: ✅ PASS (Blocked with UNAUTHORIZED)
- Authenticated mutation tests (ADMIN vs OWNER): ✅ PASS (Verified via `scripts/security-test.ts`)
- Route guard and redirect tests (`/login` flow): ✅ PASS (Page guards & middleware in place)
- Session-expiry and isActive behavior: ✅ PASS (Server-authoritative check on every request)
- Existing business-flow regression checks: ✅ PASS (Action signatures preserved)

---

# 3. Phase 2G.2 — Server-Side Selling Price Enforcement

**Status: NOT STARTED**

## Problem

The current sale flow validates the format of `unitPrice`, but the server accepts a client-supplied price.

A manipulated request could potentially submit:

```text
productId = valid product
quantity = 1
unitPrice = 0
```

without the server enforcing the actual DB selling price.

## Target Architecture

```text
Client
  ↓
productId + quantity + selling mode
  ↓
Server
  ↓
Read active product from DB
  ↓
Determine authoritative selling price
  ↓
Create Sale
```

### Requirements

- Server must derive or enforce the authoritative selling price.
- Respect the application's existing selling mode (`price` / `preparedPrice`) where applicable.
- Do not trust monetary values supplied by the client.
- Preserve valid POS behavior.

### Verification

Test:

- Normal sale
- Prepared-product sale
- Price change before checkout
- Manipulated `unitPrice`
- Deactivated product
- Invalid product ID
- Concurrent sale
- Stock consistency

---

# 4. Phase 2G.3 — Sale Idempotency / Duplicate Checkout Protection

**Status: NOT STARTED**

## Problem

The POS currently prevents duplicate checkout primarily through client-side submission state.

The server does not currently have a dedicated idempotency mechanism.

Potential scenario:

```text
User checkout
    ↓
Network retry / duplicate request
    ↓
Server receives request twice
    ↓
Two separate sales could be created
```

## Objective

Make sale creation idempotent at the server boundary.

### Requirements

- Generate/use an idempotency key per checkout attempt.
- Server must recognize a repeated key.
- Repeated request must not create a second Sale.
- Preserve transaction atomicity.
- Do not rely only on disabled buttons or React state.

### Verification

Test:

- Normal checkout
- Double click
- Duplicate HTTP/server action invocation
- Network retry simulation
- Same key with identical payload
- Same key with conflicting payload
- Stock consistency
- Payment consistency

---

# 5. Phase 2G.4 — Revalidation / Cache Consistency

**Status: NOT STARTED**

## Problem Identified in Phase 2F

Several mutation actions only revalidate `/` while affected pages can remain stale.

Examples:

### Product mutations

Potentially affected:

- `/stok`
- `/jual`
- `/produk/[id]`
- dashboard

### Sale mutation

Potentially affected:

- `/jual`
- `/stok`
- `/laporan`
- dashboard/business report

### Purchase mutation

Potentially affected:

- `/pembelian`
- `/stok`
- `/laporan`
- dashboard

### Supplier mutation

Potentially affected:

- `/supplier`
- `/pembelian`
- `/pembelian/baru`

## Important

Before implementing a generic revalidation helper, audit the actual Next.js cache/revalidation behavior used by the application.

Do not blindly add paths.

### Verification

Confirm:

- Product creation appears immediately where expected.
- Product updates propagate correctly.
- Stock adjustments propagate.
- Sales update stock/reporting.
- Purchases update stock/reporting.
- Supplier activation changes propagate.
- Open tabs/navigation do not show unexpectedly stale RSC data.

---

# 6. Phase 2G.5 — Production Hardening Verification

**Status: NOT STARTED**

After 2G.1 through 2G.4 are complete, perform a consolidated verification.

## Required Checks

### Security

- Authentication
- Authorization
- Direct Server Action invocation
- Price tampering
- Idempotency
- Validation
- Error leakage
- CSRF behavior
- Ownership/privilege boundaries where applicable

### Business Integrity

- Sale → stock deduction
- Purchase → stock addition
- Stock adjustment → StockLog
- HPP → SaleItem snapshot
- Reports → Sale/Expense data
- Dashboard → source-of-truth data

### Technical

- `npx tsc --noEmit`
- Targeted ESLint
- Relevant route regression checks
- No mock/runtime dependency regression
- No ProductContext/SalesContext regression

---

# 7. Phase 2H — Sales Transaction History

**Status: NOT STARTED**

## Business Requirement

Users need to see transactions for products that have already been sold.

The existing POS creates `Sale` / `SaleItem`, but the application needs a proper user-facing transaction history.

---

## 2H.1 — Sales History Analysis

**Mode: ANALYSIS ONLY**

### Audit

Inspect:

- Prisma `Sale`
- Prisma `SaleItem`
- Existing sales service
- Existing sale server actions
- Existing `/laporan`
- Dashboard/report queries
- Transaction numbering
- Payment fields
- HPP/profit fields
- Existing route/navigation structure
- Existing pagination/filter patterns

### Determine

- Best route for transaction history
- Query/service design
- Required fields
- Detail page/sheet design
- Pagination strategy
- Search/filter requirements
- Relationship to reports
- Relationship to future piutang

### Constraints

No implementation until the analysis has been reviewed and approved.

---

## 2H.2 — Sales History Backend

Implement the approved backend/query architecture.

Expected capabilities may include:

```text
getSales()
getSaleById()
```

Use names consistent with the existing codebase.

### Requirements

- Prisma/DB as source of truth
- Canonical UUIDs
- No mock data
- No client-side fake transaction state
- Preserve existing sale logic

---

## 2H.3 — Sales History UI

Provide a practical transaction history.

Example:

```text
Transaksi
────────────────────────
TRX-001
15 Sep 2026
3 item
Rp125.000
Lunas

TRX-002
15 Sep 2026
2 item
Rp48.000
Lunas
```

Transaction detail should be able to show:

- Transaction number
- Date/time
- Items
- Quantity
- Unit price
- Item subtotal
- Total
- Payment
- Change
- Payment status
- HPP/profit information where appropriate

Do not lock the final route/layout until 2H.1 analysis is approved.

---

## 2H.4 — Sales History Verification

Test:

- New sale appears
- Existing sales appear
- Detail data is correct
- Quantity is correct
- Price is correct
- Total is correct
- Payment data is correct
- UUIDs remain canonical
- No mock/context dependency
- Stock logic remains unchanged

---

# 8. Phase 2I — Customer Receivables / Piutang

**Status: NOT STARTED**

## Business Requirement

Support transactions where:

> The customer has already taken the goods, but has not paid yet.

This means the transaction is a real sale and stock must decrease, while the unpaid amount becomes a customer receivable.

Core flow:

```text
Goods taken
    ↓
Sale recorded
    ↓
Cash not fully received
    ↓
Receivable increases
    ↓
Customer pays later
    ↓
Receivable decreases
    ↓
Cash increases
```

## Important Accounting Principle

A receivable is **not another sale**.

When the customer pays later:

```text
Receivable ↓
Cash ↑
```

The application must not create a second sale.

---

## 2I.1 — Receivables Domain Analysis

**Mode: ANALYSIS ONLY**

This is a mandatory design phase before implementation.

### Audit

Inspect:

- `Sale`
- `SaleItem`
- Payment fields
- Existing payment flow
- Reports
- Dashboard
- Prisma schema
- Transaction model
- Customer-related entities if any
- Existing financial/expense structures

### Determine

Whether the domain should use:

### Option A — Sale-integrated receivable

Receivable state is represented directly in the Sale/payment model.

### Option B — Dedicated receivable model

Potential structure:

```text
Sale
  ↓
Receivable
  ↓
ReceivablePayment
```

Do not choose based on assumption.

Choose the smallest architecture that fits the application's actual business model and future requirements.

### Required Business Decisions

Determine support for:

- Fully paid sale
- Fully unpaid sale
- Partial payment
- Multiple payments
- Customer identity
- Outstanding balance
- Payment history
- Settlement
- Optional due date
- Receivable status
- Reporting semantics

No schema or code changes before this analysis is approved.

---

# 9. Phase 2I.2 — Receivables Database / Domain Implementation

**Status: WAITING FOR 2I.1 REVIEW**

If the approved design requires schema changes:

```text
Prisma schema
    ↓
Migration
    ↓
Prisma Client
    ↓
Service
    ↓
Server Action
```

### Requirements

- Preserve transaction atomicity.
- Preserve stock integrity.
- Preserve existing Sale/SaleItem semantics.
- Do not create duplicate sales when receiving debt payments.
- Use DB transactions for related financial mutations.

---

# 10. Phase 2I.3 — Sale + Receivable Integration

The POS should support payment states such as:

```text
Lunas
Belum Bayar
Sebagian
```

Potential example:

```text
Total       Rp100.000
Dibayar     Rp40.000
Piutang     Rp60.000
```

Or:

```text
Total       Rp100.000
Dibayar     Rp0
Piutang     Rp100.000
```

### Important

The exact UI and fields must follow the approved 2I.1 domain design.

### Required Integrity

When goods leave inventory:

```text
Stock ↓
Sale created
```

If unpaid:

```text
Cash unchanged
Receivable ↑
```

If partially paid:

```text
Cash ↑ by payment amount
Receivable ↑ by remaining amount
```

If fully paid later:

```text
Receivable ↓
Cash ↑
```

---

# 11. Phase 2I.4 — Receivables Management UI

Potential structure:

```text
Piutang
────────────────────────

Budi
Total Utang     Rp250.000

Siti
Total Utang     Rp75.000
```

Customer detail:

```text
Budi

TRX-001   Rp100.000
TRX-014   Rp150.000
────────────────────
Total     Rp250.000

[ Bayar Utang ]
```

Payment flow:

```text
Total Piutang     Rp250.000
Bayar             Rp100.000
Sisa              Rp150.000
```

### Requirements

- Show outstanding balance
- Show transaction source
- Show payment history where supported
- Prevent overpayment where inappropriate
- Update balance atomically
- Refresh affected views

---

# 12. Phase 2I.5 — Receivables Integration with Reports & Dashboard

The system must distinguish:

```text
Sales              Rp10.000.000
Cash Received       Rp8.000.000
Outstanding Debt    Rp2.000.000
```

Do not treat:

```text
Sale = Cash Received
```

when unpaid/partially paid sales exist.

Later debt settlement must:

```text
Receivable ↓
Cash ↑
```

and must **not** increase sales a second time.

### Audit

Review:

- Business report
- Dashboard
- Sales report
- Cash/balance metrics
- Transaction history
- Any financial summary cards

---

# 13. Phase 2I.6 — Receivables E2E Verification

Minimum scenarios:

1. Fully paid sale
2. Fully unpaid sale
3. Partial payment
4. Later settlement
5. Multiple customers
6. Multiple debt transactions for one customer
7. Multiple payments for one transaction
8. Stock decreases when goods are taken
9. Sale remains recorded
10. Cash only increases according to actual payment
11. Receivable increases/decreases correctly
12. No duplicate sale during debt settlement
13. Dashboard does not double-count
14. Reports do not double-count
15. Sale history shows payment status
16. Duplicate checkout remains protected

---

# 14. Phase 2J — Business Report UI Cleanup

**Status: NOT STARTED**

## Requirement

In the Business Report screen, remove the decorative circular background behind the icon on the **LABA BERSIH** card.

The icon itself should remain.

Current visual concept:

```text
┌──────────────────────────┐
│ LABA BERSIH          ✨   │
│                          │
│ Rp -94.630              │
│ Rugi Bersih             │
└──────────────────────────┘
```

Remove only the circular decorative background.

---

## 2J.1 — UI Analysis

Identify the exact component responsible for the Business Report card.

Confirm:

- Which element creates the circle
- Whether it is a background, pseudo-element, wrapper, or icon container
- Other cards are unaffected
- Mobile layout is unaffected

### Constraint

Do not modify business logic or financial calculations.

---

## 2J.2 — Execute UI Cleanup

Make the smallest possible UI/CSS change.

Do not alter:

- Financial calculations
- Report queries
- Sale logic
- Expense logic
- Card data
- Unrelated visual components

---

## 2J.3 — Verification

Verify:

- Circle is removed
- Icon remains
- Card remains aligned
- Desktop layout is correct
- Mobile layout is correct
- TypeScript passes
- Targeted ESLint passes

---

# 15. Final Audit

After 2G, 2H, 2I, and 2J are complete, perform a final system audit.

## Architecture

Confirm:

- No `ProductContext`
- No `SalesContext`
- No runtime mock product data
- No runtime mock sales data
- No legacy Zustand product/sales state
- DB is the runtime source of truth

## Security

Confirm:

- Authentication enforced
- Authorization enforced where applicable
- Server-side price enforcement
- Sale idempotency
- Input validation
- Safe error handling
- CSRF/security boundaries remain intact

## Inventory

Confirm:

```text
Purchase → Stock ↑
Sale → Stock ↓
Adjustment → Stock ±
StockLog → consistent
```

## Sales

Confirm:

```text
Sale
 ├── SaleItem
 ├── HPP snapshot
 ├── Payment
 └── optional Receivable
```

## Receivables

Confirm:

```text
Unpaid sale
    ↓
Receivable ↑

Customer payment
    ↓
Receivable ↓
Cash ↑
```

No second sale is created by debt settlement.

## Reporting

Confirm:

- Sales are counted correctly
- Expenses are counted correctly
- Profit is correct
- Cash/balance is not confused with sales
- Receivables are separated from cash where appropriate
- Dashboard and Business Report are consistent

## Verification Commands

At minimum:

```bash
npx tsc --noEmit
npx eslint <relevant-files>
```

Also run relevant application-level regression tests and manual E2E flows.

---

# 16. Execution Rules

These rules apply to all future phases.

## Rule 1 — Analysis Before Implementation

For complex or security-sensitive phases:

```text
ANALYSIS
   ↓
User review
   ↓
APPROVAL
   ↓
EXECUTION
   ↓
VERIFICATION
   ↓
User review
```

Do not skip the analysis phase.

## Rule 2 — Minimal Scope

Do not modify unrelated:

- business logic
- UI
- routes
- schema
- seed data
- mock data
- services

unless explicitly required by the approved phase.

## Rule 3 — Database Is Source of Truth

Do not reintroduce:

- ProductContext
- SalesContext
- localStorage product state
- sessionStorage product state
- runtime mock products
- hardcoded product slug mapping

## Rule 4 — Preserve Seed Data

The following are legitimate seed-only data and must remain unless the seed architecture is explicitly changed:

```text
MOCK_CATEGORIES
MOCK_PRODUCTS
MOCK_PURCHASES
MOCK_EXPENSES
```

## Rule 5 — No Guessing

When an implementation depends on existing architecture:

1. Inspect the actual code.
2. Identify the existing pattern.
3. Propose the smallest compatible change.
4. Stop for review when the phase requires analysis.
5. Implement only after approval.

## Rule 6 — Verification Is Mandatory

Every execution phase must end with verification appropriate to its scope.

---

# 17. Current Next Step

**The immediate next task is:**

## 2G.1-E — Authentication & Authorization Implementation Plan (PLAN ONLY)

The 2G.1 security audit has completed.

Next step: Produce the comprehensive **Phase 2G.1-E Implementation Plan** (evaluating auth library options, schema design, session cookies, route middleware, and centralized Server Action guards) and wait for user approval before modifying code.

Workflow:

```text
2G.1 Audit (✅ Complete)
    ↓
2G.1-E Implementation Plan (PLAN ONLY)
    ↓
Review & Approve Plan
    ↓
2G.1-E Implementation & Verification
    ↓
2G.2 Price Enforcement
    ↓
2G.3 Idempotency
    ↓
2G.4 Revalidation
    ↓
2G.5 Hardening Verification
    ↓
2H Sales History
    ↓
2I Receivables / Piutang
    ↓
2J Business Report UI Cleanup
    ↓
Final Audit
```

---

# Status Legend

- ✅ PASS — completed and verified
- 🟡 PASS WITH ISSUES — completed but follow-up work remains
- 🔵 NOT STARTED — queued
- 🟠 ANALYSIS ONLY — inspect/report, no implementation
- ⏸️ WAITING FOR REVIEW — implementation blocked until analysis is approved
