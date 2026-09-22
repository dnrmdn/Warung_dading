# Audit: Transaction History Date Filter (/transaksi)

## 1. Current Architecture

The `/transaksi` route is currently structured as a Next.js Server Component page with client-side interaction handling:

```text
Page (app/transaksi/page.tsx)
  │
  ├── enforceAdminPage() [lib/auth/page-guard.ts] (Role authorization: ADMIN)
  ├── getTodayLocalDate() [lib/services/sales.ts]
  │
  └── getSales({ startDate: today, endDate: today }) [lib/services/sales.ts]
        │
        └── Prisma Client (prisma.sale.findMany)
              │
              ├── Table: Sale (WHERE transactionDate >= 'todayT00:00:00Z' AND <= 'todayT00:00:00Z')
              │   Include: items (SaleItem table)
              │   OrderBy: [ { transactionDate: 'desc' }, { createdAt: 'desc' } ]
              │
              └── toDomainSale() mapping
  │
  ▼
UI Rendering (app/transaksi/page.tsx)
  │
  ├── AppShell [components/layout/app-shell.tsx]
  ├── HeaderBar [components/navigation/header-bar.tsx] (title="Transaksi Hari Ini", subtitle="Riwayat penjualan hari ini")
  │
  └── TransaksiClient [components/transaksi/transaksi-client.tsx]
        │
        ├── Summary KPI Cards (Omzet Hari Ini, Transaksi Hari Ini)
        ├── Transaction Cards List (mapped from initialSales)
        │     └── Click item ──► handleSelectSale(sale)
        │                           │
        │                           └── if partial/unpaid:
        │                                 calls getSaleByIdAction(sale.id) [app/actions/sales.ts]
        │
        └── TransaksiDetailSheet [components/transaksi/transaksi-detail-sheet.tsx] (Bottom sheet detail drawer)
```

### Exact Files and Functions
* **Page**: `app/transaksi/page.tsx` (`TransaksiPage`)
* **Page Loading**: `app/transaksi/loading.tsx` (`LoadingTransaksi`)
* **Client Root**: `components/transaksi/transaksi-client.tsx` (`TransaksiClient`)
* **Detail Sheet**: `components/transaksi/transaksi-detail-sheet.tsx` (`TransaksiDetailSheet`)
* **Server Action**: `app/actions/sales.ts` (`getSalesAction`, `getSaleByIdAction`)
* **Service**: `lib/services/sales.ts` (`getSales`, `getSaleById`, `getTodayLocalDate`)
* **Prisma Model**: `Sale`, `SaleItem`, `ReceivablePayment` in `prisma/schema.prisma`

---

## 2. Current Date Logic

### Today's Date Calculation
In `lib/services/sales.ts`:
```ts
const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getTodayLocalDate(date = new Date()): string {
  return JAKARTA_DATE_FORMATTER.format(date);
}
```
* **Timezone**: Explicitly set to `'Asia/Jakarta'` (WIB, UTC+7) using `Intl.DateTimeFormat` with `'en-CA'` locale producing formatted string `YYYY-MM-DD`.
* **Where Filter Calculation**: In `app/transaksi/page.tsx`, `const today = getTodayLocalDate()` is passed into `getSales({ startDate: today, endDate: today })`.
* **Database Date Field**: `Sale.transactionDate` is defined in Prisma schema as `DateTime @db.Date` (PostgreSQL DATE column type without time component).
* **Start and End Calculations**:
  ```ts
  function parseDateToUtcMidnight(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00.000Z`);
  }
  ```
  `where.transactionDate.gte = parseDateToUtcMidnight(filter.startDate);`
  `where.transactionDate.lte = parseDateToUtcMidnight(filter.endDate);`
* **Filter Execution Location**: Executed **server-side** in Postgres via Prisma SQL query. No client-side filtering occurs.

---

## 3. Current Transaction Query

In `lib/services/sales.ts` (`getSales(filter?: GetSalesFilter)`):

```ts
export async function getSales(filter?: GetSalesFilter): Promise<Sale[]> {
  const where: Prisma.SaleWhereInput = {};

  if (filter?.startDate || filter?.endDate) {
    where.transactionDate = {};
    if (filter.startDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
        throw new SalesValidationError('Format startDate harus YYYY-MM-DD');
      }
      where.transactionDate.gte = parseDateToUtcMidnight(filter.startDate);
    }
    if (filter.endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
        throw new SalesValidationError('Format endDate harus YYYY-MM-DD');
      }
      where.transactionDate.lte = parseDateToUtcMidnight(filter.endDate);
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: [
      { transactionDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filter?.limit,
  });

  return sales.map(toDomainSale);
}
```

### Query Analysis
* **Parameters accepted**: Already accepts `{ startDate?: string; endDate?: string; limit?: number }`. It is **100% reusable** for any single date or date range!
* **Relations included**: `items: true` (eager-loads `SaleItem` rows).
* **Ordering**: `transactionDate: 'desc'`, followed by `createdAt: 'desc'`.
* **Limit/Pagination**: `take: filter?.limit`. In `page.tsx`, no limit is passed, so all transactions matching the date are returned.
* **Receivable Payments**: Not included in `getSales` by default; fetched on demand via `getSaleById` / `getSaleByIdAction` when opening partial/unpaid sales.

---

## 4. Reusable Components

The codebase has proven UI and utility patterns ready to reuse:

1. **Segmented Tabs / Pill Buttons**:
   * Pattern in `components/laporan/report-filter-bar.tsx` and `components/jual/category-chips.tsx`:
     ```tsx
     <button
       type="button"
       onClick={...}
       className={cn(
         'px-3.5 py-1.5 rounded-full text-small font-semibold transition-all select-none',
         isActive
           ? 'bg-primary text-white shadow-xs'
           : 'bg-surface border border-border text-text-secondary hover:text-text'
       )}
     >
       {label}
     </button>
     ```
   * Or compact 2-button segmented control container:
     ```tsx
     <div className="grid grid-cols-2 p-1 bg-surface-subtle border border-border rounded-xl">
       <button ...>Hari Ini</button>
       <button ...>Sebelumnya</button>
     </div>
     ```

2. **Native Date Picker / Input**:
   * Found in `components/laporan/report-filter-bar.tsx` (lines 134–154), `components/pengeluaran/catat-pengeluaran-client.tsx`, and `components/pembelian/catat-pembelian-client.tsx`.
   * Styling standard:
     ```tsx
     <input
       type="date"
       value={selectedDate}
       max={yesterdayOrMaxDate}
       onChange={(e) => ...}
       className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-body text-text font-medium focus:outline-hidden focus:border-primary"
     />
     ```
   * Using native HTML5 `<input type="date">` is the established convention across the entire app; it integrates with mobile OS native wheels/calendar pickers without extra libraries.

3. **Date Formatting Helpers**:
   * Indonesian date formatting:
     ```ts
     const [y, m, d] = dateStr.split('-').map(Number);
     new Date(y, m - 1, d).toLocaleDateString('id-ID', {
       day: 'numeric',
       month: 'long',
       year: 'numeric',
     });
     ```
   * Timezone reference: `lib/services/sales.ts` (`getTodayLocalDate`).

4. **Empty State & Loading**:
   * Current empty state in `components/transaksi/transaksi-client.tsx` (lines 125–135) with `Inbox` icon from `lucide-react`.
   * Skeleton loading in `app/transaksi/loading.tsx`.

---

## 5. Proposed Minimal Architecture

### Minimal State & Routing Strategy
We have two viable approaches:
* **Option A (URL Query Param Driven - Server Component Refresh)**:
  Use Next.js navigation with URL search params: `/transaksi?date=YYYY-MM-DD` (or `/transaksi` for today).
  * *Pros*: Native browser back/forward, shareable URL, uses existing Server Component data loading in `page.tsx`, consistent with `/laporan`.
  * *UI*: Tab bar (`[ Hari Ini ] [ Sebelumnya ]`) updates the URL.
* **Option B (Client-Side State with Server Action `getSalesAction`)**:
  Keep `TransaksiClient` handling the tab toggle and date change, calling `getSalesAction({ startDate, endDate })` via React `useTransition`.
  * *Pros*: Extremely snappy tab switching, no full page transition, keeps today's data cached in memory if toggling back.

**Recommended Approach: Option A with Next.js router transitions (or Option B with shallow searchParams)**.
Option A is the most idiomatic in this repository because `/laporan`, `/stok`, and `/pengeluaran` use Server Component query parameters (`searchParams: Promise<{ date?: string }>`).

### UI Layout Structure
Under `HeaderBar`:
1. **Segmented Tab Control**:
   * `[ Hari Ini ]` and `[ Sebelumnya ]`
2. **Date Selector (Shown only when `Sebelumnya` is active)**:
   * A compact date picker button or input displaying the selected previous date (e.g., `20 September 2026`).
   * Constraint: `max={yesterdayStr}`.
3. **Summary KPI Cards**:
   * Updates title labels contextually:
     * When Hari Ini: "Omzet Hari Ini", "Transaksi Hari Ini"
     * When Sebelumnya: "Omzet (20 Sep 2026)", "Transaksi (20 Sep 2026)"
4. **Transaction List**:
   * Displays the cards for the selected date.
5. **Empty State**:
   * Shows contextual message:
     * Hari ini: "Belum ada transaksi hari ini"
     * Sebelumnya: "Belum ada transaksi pada 20 September 2026"

---

## 6. Proposed Data Flow

### Hari Ini (Default)
```text
User navigates to /transaksi (no searchParams or tab='today')
  │
  ├── today = getTodayLocalDate()
  ├── getSales({ startDate: today, endDate: today })
  └── Render with activeTab = 'today'
```

### Sebelumnya (Previous Date Selected)
```text
User clicks [ Sebelumnya ]
  │
  ├── Default previous date: yesterday (e.g., today minus 1 day in Asia/Jakarta)
  ├── User can tap date picker to select any valid previous date (<= yesterday)
  │
  ├── Trigger navigation / fetch:
  │     selectedDate = 'YYYY-MM-DD'
  │     getSales({ startDate: selectedDate, endDate: selectedDate })
  │
  └── Render with activeTab = 'previous', showing:
        - Date Selector showing Indonesian formatted date (e.g. "20 September 2026")
        - Transactions for selectedDate
        - Empty state tailored to selectedDate if 0 transactions found
```

---

## 7. Edge Cases & Handling

1. **Future Date Selection**:
   * Native HTML date input with `max={yesterdayStr}` disables future dates in browser picker.
   * Server-side guard: If a date > `today` is passed in URL query param, automatically fallback to `yesterday` or `today`.
2. **Today Selected Under "Sebelumnya"**:
   * `max` is strictly set to `yesterdayStr` (not today), preventing the user from picking today under "Sebelumnya".
   * If user manually types today in URL param, the UI cleanly switches active tab to "Hari Ini" or redirects to `/transaksi`.
3. **Selected Date with No Transactions**:
   * Display empty state preserving the exact visual language of the current empty state:
     ```text
     [ Inbox Icon ]
     Tidak ada transaksi
     Belum ada transaksi tercatat pada {formatDateIndo(selectedDate)}.
     ```
4. **Timezone Boundaries**:
   * All date calculations for "today" and "yesterday" will use `getTodayLocalDate()` (`Asia/Jakarta`).
   * The query converts `'YYYY-MM-DD'` to UTC Midnight for `@db.Date` querying, exactly matching existing `Sale.transactionDate` storage.
5. **Date Persistence When Switching Tabs**:
   * If user selects `2026-09-18` under "Sebelumnya", clicks "Hari Ini", then clicks back to "Sebelumnya", remember `2026-09-18` in component state / URL param so they don't lose their selected date.
6. **Page Refresh & Browser Navigation (Back / Forward)**:
   * Having the date in search params (e.g., `/transaksi?tab=sebelumnya&date=2026-09-20`) ensures refresh and back/forward navigation work reliably.

---

## 8. Implementation Plan

### Files Likely to Change
1. **`app/transaksi/page.tsx`**:
   * Accept `searchParams: Promise<{ tab?: string; date?: string }>`.
   * Resolve selected date (today vs custom previous date).
   * Pass active date & initial sales to client.
2. **`components/transaksi/transaksi-client.tsx`**:
   * Add tab selector (`Hari Ini` / `Sebelumnya`).
   * Add date selector for `Sebelumnya` with `max={yesterday}`.
   * Adapt KPI labels and empty state text based on selected date.
3. **`lib/services/sales.ts`** (optional / minor):
   * Add a small helper `getYesterdayLocalDate()` if needed (or calculate in date utilities).

### Files That Should Remain Untouched
* `prisma/schema.prisma` (no schema change needed)
* `app/actions/sales.ts` (already exposes `getSalesAction` and `getSaleByIdAction`)
* `components/transaksi/transaksi-detail-sheet.tsx` (detail modal works identically for any transaction)
* `lib/services/sales.ts` core query (`getSales` already supports `startDate` and `endDate`)
* `lib/auth/page-guard.ts` (authorization remains unchanged)
* `components/layout/app-shell.tsx`

---

## 9. Performance Assessment

* **Query Complexity**: `prisma.sale.findMany` with `where: { transactionDate: { gte: date, lte: date } }`. This is an exact single-day filter.
* **Selectivity**: High. Single-day filtering limits results to a single business day's sales (typically tens to hundreds of rows for a warung).
* **Relations**: Only `items: true` is included. `receivablePayments` is lazy-loaded only when viewing detail of an unpaid/partial transaction.
* **Volume**: Minimal memory footprint; no performance bottleneck with single-day filtering.

---

## 10. Scope Guard Confirmation

* [x] No source code modified
* [x] No Prisma schema modified
* [x] No migration
* [x] No database changes
* [x] No dependency installation
* [x] No UI implementation
* [x] No business logic implementation
* [x] Only `transaction-history-audit.md` created
