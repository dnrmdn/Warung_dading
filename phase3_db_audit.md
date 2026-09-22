# Phase 3 — Database Query & Index Performance Audit

## 1. Executive Summary

This read-only audit evaluated the database architecture, query access paths, PostgreSQL query planning, and round-trip connection latencies for **Warung Smart**.

### Key Findings
1. **The Primary Bottleneck is Network Round-Trip Latency, Not SQL Execution Time**:
   - The PostgreSQL engine executes typical queries in **0.05 ms to 0.44 ms** (measured via `EXPLAIN (ANALYZE, BUFFERS)`).
   - However, client-side measured query durations range from **450 ms to 1,024 ms**.
   - A bare `SELECT 1` ping over the connection pooler takes **452 ms (min) / 459 ms (median) / 496 ms (avg) / 679 ms (max)**.
   - Consequently, **>98% of all observed query latency** is network transmission and TLS/pooler negotiation across geographical distance between the application runtime and the Supabase pooler in Seoul (`aws-0-ap-northeast-2.pooler.supabase.com:6543`), not PostgreSQL database engine execution or missing indexes.
2. **Current Table Sizes & Index Efficiency**:
   - The current production database contains modest operational datasets (e.g. 92 Products, 15 Sales, 24 SaleItems, 2 Purchases, 0 Expenses).
   - Sequential scans at this table volume execute in **under 0.1 ms** with **1 to 5 shared buffer hits** directly in PostgreSQL memory.
   - Adding indexes at current row volumes would produce **0.0 ms measurable user-perceived improvement** because the 450+ ms network round-trip overhead dwarfs internal execution times by a factor of 1,000x.
3. **Multi-Query Amplification**:
   - Routes that dispatch multiple queries across multiple waves or sub-queries (e.g., `getDashboardStats()` and `getReportData()`) experience latency amplification (~900 ms – 1,024 ms) due to the serialization of parallel connection requests across the Supabase transaction pooler.

---

## 2. Environment

- **Node Version**: `v24.21.0` (`win32`, `x64`)
- **Prisma Client**: `^5.22.0`
- **Next.js Framework**: `16.3.5` (Turbopack)
- **Database Engine**: PostgreSQL 15.8 on Supabase
- **Database Endpoint**: `aws-0-ap-northeast-2.pooler.supabase.com:6543` (Seoul, South Korea)
- **Environment Type**: Local development environment querying remote Supabase transaction pooler over WAN.

---

## 3. Route Query Map

| Route / Feature | Service | Query Operation | Tables Involved | Frequency | Potential Concern |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Dashboard) | `dashboard.ts` | `getDashboardStats()`: 5 parallel queries in Wave 1 + 2 parallel sub-queries in Wave 2 | `Sale`, `SaleItem`, `Product` | High (Home tab) | 2 sequential query waves over WAN. |
| `/jual` (POS) | `products.ts` | `getProducts({ includeRecipe: false })`, `getCategories()` | `Product`, `Category` | Very High (POS cashier) | Low; already optimized via lightweight query. |
| `/stok` (Inventory) | `products.ts` | `getProducts({ includeRecipe: true })`, `getCategories()` | `Product`, `Category`, `RecipeComponent` | High | Join on `RecipeComponent` increases payload; acceptable for stock view. |
| `/pembelian/baru` | `products.ts` | `getProducts()`, `getCategories()` | `Product`, `Category` | Moderate | Unindexed FK lookup on `categoryId`. |
| `/transaksi` | `sales.ts` | `getSales(today)` with `items: true` | `Sale`, `SaleItem` | High (daily checks) | Sequential scan on `Sale.transactionDate`. |
| `/piutang` | `sales.ts` | `getReceivableSummary()` | `Sale` | High (credit tracking) | Filter on `amountDue > 0 AND customerName IS NOT NULL`. |
| `/pengeluaran` | `expenses.ts` | `getExpenses()` | `Expense` | Moderate | Full table scan ordered by `expenseDate DESC, createdAt DESC`. |
| `/supplier` | `suppliers.ts` | `getSuppliers(activeOnly)` | `Supplier` | Low | Scans active suppliers ordered by name. |
| `/laporan` | `reports.ts` | `getReportData()`: 10 parallel queries in Wave 1 + 2 parallel sub-queries in Wave 2 | `Sale`, `SaleItem`, `Expense`, `Purchase`, `ReceivablePayment` | Moderate (Managerial) | Wave 2 waits on `topSaleItems` product IDs. |

---

## 4. Query Timing Benchmark

Measured using 2 warmup iterations followed by 5 timed runs each:

| Query | Min (ms) | Median (ms) | Average (ms) | Max (ms) | Notes |
| :--- | --: | --: | --: | --: | :--- |
| `SELECT 1` (Baseline RTT) | **452** | **459** | **496** | **679** | Pure round-trip overhead (10 warm runs) |
| `getCategories()` | **449** | **452** | **463** | **497** | 1 RTT; 9 rows |
| `getExpenses(thisMonth)` | **449** | **453** | **458** | **468** | 1 RTT; 0 rows |
| `getReceivableSummary()` | **451** | **456** | **462** | **480** | 1 RTT; 1 row |
| `getSuppliers(activeOnly)` | **459** | **490** | **509** | **561** | 1 RTT; 1 row |
| `getPurchases(recent)` | **628** | **637** | **653** | **724** | 1 RTT with relations; 2 purchases |
| `getSales(today)` | **642** | **714** | **757** | **957** | 1 RTT with `SaleItem` relation |
| `getProducts(lightweight)` | **695** | **834** | **812** | **943** | 1 RTT with `Category` relation; 92 rows |
| `getProducts(with recipes)` | **850** | **872** | **902** | **987** | 1 RTT with `Category` & `RecipeComponent` |
| `getReportData(thisMonth)` | **902** | **907** | **952** | **1,090** | 2 waves: 10 queries + 2 sub-queries |
| `getDashboardStats()` | **913** | **970** | **1,024** | **1,148** | 2 waves: 5 queries + 2 sub-queries |

---

## 5. Index Inventory

Inspection of PostgreSQL catalog (`pg_indexes`) revealed the following indexes in schema `public`:

| Table | Index Name | Columns Indexed | Type | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Category` | `Category_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `Category` | `Category_name_key` | `name` | UNIQUE | Duplicate category prevention |
| `Product` | `Product_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `RecipeComponent` | `RecipeComponent_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `RecipeComponent` | `RecipeComponent_materialProductId_idx` | `materialProductId` | BTREE | Foreign key lookups for material products |
| `StockAdjustmentLog` | `StockAdjustmentLog_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `StockAdjustmentLog` | `StockAdjustmentLog_productId_createdAt_idx` | `productId`, `createdAt` | BTREE | Stock history by product |
| `Supplier` | `Supplier_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `Supplier` | `Supplier_name_key` | `name` | UNIQUE | Unique supplier names |
| `Purchase` | `Purchase_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `PurchaseItem` | `PurchaseItem_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `Sale` | `Sale_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `Sale` | `Sale_transactionNumber_key` | `transactionNumber` | UNIQUE | Transaction code lookup |
| `SaleItem` | `SaleItem_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `SaleItem` | `SaleItem_productId_createdAt_idx` | `productId`, `createdAt` | BTREE | Sales history by product |
| `ReceivablePayment`| `ReceivablePayment_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `ReceivablePayment`| `ReceivablePayment_saleId_paidAt_idx` | `saleId`, `paidAt` | BTREE | Settlements by sale and date |
| `Expense` | `Expense_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `user` | `user_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `user` | `user_email_key` | `email` | UNIQUE | Login email resolution |
| `session` | `session_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `session` | `session_token_key` | `token` | UNIQUE | Better Auth token validation |
| `session` | `session_userId_idx` | `userId` | BTREE | User session list |
| `account` | `account_pkey` | `id` | UNIQUE PK | Primary key lookups |
| `account` | `account_userId_idx` | `userId` | BTREE | User account provider list |

### Notable Unindexed Foreign Keys & Filter Columns:
- `Product.categoryId`: Foreign key to `Category(id)` is unindexed.
- `Sale.transactionDate`: Used in daily and period filters; unindexed.
- `Sale.amountDue`: Used in receivables filter; unindexed.
- `SaleItem.saleId`: Foreign key to `Sale(id)` is unindexed.
- `PurchaseItem.purchaseId`: Foreign key to `Purchase(id)` is unindexed.
- `PurchaseItem.productId`: Foreign key to `Product(id)` is unindexed.
- `RecipeComponent.productId`: Foreign key to `Product(id)` is unindexed.
- `Expense.expenseDate`: Used in monthly expense filters; unindexed.

---

## 6. EXPLAIN (ANALYZE, BUFFERS) Findings

Execution plans were captured directly on PostgreSQL for critical read queries:

### Query 1: Product List (`getProducts()`)
```text
Sort Key: p.family, p.name
Sort Method: quicksort  Memory: 33kB
Buffers: shared hit=24
->  Nested Loop  (cost=0.16..10.99 rows=92 width=101) (actual time=0.054..0.197 rows=92 loops=1)
      Buffers: shared hit=21
      ->  Seq Scan on "Product" p  (cost=0.00..5.92 rows=92 width=106) (actual time=0.023..0.076 rows=92 loops=1)
            Filter: "isActive"
            Buffers: shared hit=5
      ->  Memoize  (cost=0.16..0.32 rows=1 width=64) (actual time=0.001..0.001 rows=1 loops=92)
            Cache Key: p."categoryId"
            Hits: 84  Misses: 8  Evictions: 0  Memory Usage: 2kB
            Buffers: shared hit=16
            ->  Index Scan using "Category_pkey" on "Category" c
Planning Time: 0.691 ms | Execution Time: 0.440 ms
```
- **Interpretation**: Total database time is **0.44 ms**. PostgreSQL memoizes the category lookups (84 hits out of 92 loops). Total shared memory reads are 24 pages (all buffer hits).

### Query 2: Daily Sales (`getSales(today)`)
```text
Sort Key: "createdAt" DESC
Sort Method: quicksort  Memory: 25kB
Buffers: shared hit=4
->  Seq Scan on "Sale"  (cost=0.00..13.75 rows=2 width=84) (actual time=0.016..0.017 rows=2 loops=1)
      Filter: ("transactionDate" = '2026-09-21'::date)
Planning Time: 0.115 ms | Execution Time: 0.105 ms
```
- **Interpretation**: Total database time is **0.105 ms**. Only 1 data page scanned in memory (13 rows removed by filter, 2 returned).

### Query 3: Outstanding Receivables (`getReceivableSummary()`)
```text
Sort Key: "transactionDate", "createdAt"
Sort Method: quicksort  Memory: 25kB
Buffers: shared hit=1
->  Seq Scan on "Sale"  (cost=0.00..13.75 rows=100 width=80) (actual time=0.017..0.018 rows=1 loops=1)
      Filter: (("customerName" IS NOT NULL) AND ("amountDue" > 0))
Planning Time: 0.164 ms | Execution Time: 0.060 ms
```
- **Interpretation**: Total database time is **0.060 ms**. Single shared buffer hit.

### Query 4: SaleItem Top Products (`getReportData` / `getDashboardStats`)
```text
Hash Join (si."saleId" = s.id)
->  Seq Scan on "SaleItem" si (actual time=0.020..0.023 rows=24 loops=1)
->  Hash (Seq Scan on "Sale" s) (actual time=0.015..0.019 rows=15 loops=1)
      Filter: ("transactionDate" >= '2026-09-01' AND "transactionDate" <= '2026-09-21')
Planning Time: 0.218 ms | Execution Time: 0.291 ms
```
- **Interpretation**: Aggregating sales over a month executes in **0.291 ms** in memory across 2 buffers.

### Query 5: Expense Monthly Filter (`getExpenses()`)
```text
Seq Scan on "Expense" (Filter: "expenseDate" >= '2026-09-01' AND "expenseDate" <= '2026-09-21')
Planning Time: 0.103 ms | Execution Time: 0.046 ms
```
- **Interpretation**: Database time is **0.046 ms**.

---

## 7. Connection Latency Analysis

Controlled test of 10 consecutive warm pings (`SELECT 1`):
- **Minimum**: 452 ms
- **Median**: 459 ms
- **Average**: 496 ms
- **Maximum**: 679 ms

### Mathematical Disconnect:
$$\text{Total Observed Client Latency} = \text{Network Latency (459 ms)} + \text{PostgreSQL Execution (0.4 ms)} = 459.4\text{ ms}$$

The PostgreSQL engine represents less than **0.1%** of the observed latency. The round-trip transmission across international transit to the `ap-northeast-2` pooler accounts for **99.9%** of the delay.

---

## 8. Findings Classification

### Confirmed Bottleneck
1. **International WAN Latency to Supabase Pooler (`ap-northeast-2`)**:
   - Directly measured and reproducible: 450–500 ms floor per round-trip.
2. **Two-Wave Query Chains**:
   - `getDashboardStats()` and `getReportData()` issue Wave 1 (aggregates) and then Wave 2 (fetching top product snapshots/catalog attributes). This forces 2 sequential WAN round-trips (~950–1,020 ms minimum).

### Likely Bottleneck (Future Growth)
1. **Unindexed Foreign Keys on High-Growth Tables**:
   - `SaleItem.saleId`, `PurchaseItem.purchaseId`, and `Product.categoryId` lack B-Tree indexes.
   - Currently negligible (0.05 ms) because tables have <100 rows. When `SaleItem` grows to 50,000+ rows, cascade deletions and joins on `saleId` will degrade into expensive sequential scans.
2. **Unindexed Temporal Range Filter (`Sale.transactionDate`)**:
   - As transaction records accumulate over months/years, filtering `transactionDate` without an index will force multi-page sequential scans.

### Potential Optimization
1. **Single-Round-Trip Database Aggregation via SQL Views / CTEs**:
   - Consolidating Wave 1 and Wave 2 of `getDashboardStats()` into a single coordinated query would eliminate one entire WAN round-trip, saving ~450 ms.
2. **Edge / Regional Server Deployment**:
   - Deploying Next.js server components in the same AWS region as the Supabase pooler (e.g. AWS Seoul `ap-northeast-2`) or collocating the database closer to users (e.g. Singapore `ap-southeast-1` or Jakarta `ap-southeast-3`).

### Not a Bottleneck
1. **Current Missing Indexes at Present Scale**:
   - Every read query in the system currently executes in **under 0.5 ms** inside PostgreSQL. Adding indexes today would not reduce the 450+ ms network round-trip time.

---

## 9. Candidate Next-Phase Changes

### Candidate 1: Collocate Next.js Application Server with Database Region
- **Evidence**: `SELECT 1` costs ~450 ms from local WAN, whereas an intra-region VPC/datacenter query costs <2 ms.
- **Affected Queries**: All queries across the entire application.
- **Expected Impact**: Page server execution drops from ~1,000 ms to <100 ms.
- **Risk**: Low (infrastructure configuration).
- **Recommendation**: Test in deployment staging; highly recommended for production deployment.

### Candidate 2: Collapse Two-Wave Services (`getDashboardStats`) into Single Wave
- **Evidence**: `getDashboardStats()` takes ~970 ms (2 round-trips) while single queries take ~460 ms (1 round-trip).
- **Affected Query**: `lib/services/dashboard.ts` (`getDashboardStats`).
- **Expected Impact**: ~450 ms savings on dashboard load.
- **Risk**: Low (refactor internal helper).
- **Recommendation**: Safe and testable candidate for Phase 4.

### Candidate 3: Proactive Composite Index on `Sale(transactionDate, amountDue)`
- **Evidence**: Primary filter column across `/transaksi`, `/laporan`, and `/piutang`.
- **Affected Queries**: `getSales()`, `getReceivableSummary()`, `getReportData()`.
- **Expected Impact**: Prevents future scan degradation once sales volume exceeds 5,000+ rows.
- **Risk**: Low (standard B-Tree index).
- **Recommendation**: Worth scheduling before large-scale production data import.

---

## 10. Scope Verification

- [x] **No source code changed**
- [x] **No Prisma schema changed**
- [x] **No migrations created**
- [x] **No database indexes created**
- [x] **No database data modified**
- [x] **No auth logic changes**
- [x] **No business logic changes**
