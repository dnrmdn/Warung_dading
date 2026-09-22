# Phase 4 — Reduce Sequential Database Round Trips

## Summary

Phase 4 eliminated the second sequential database wave in both `getDashboardStats` and `getReportData` by pre-fetching dependency-bound queries in Wave 1 with broadened (unfiltered) parameters. All data is now resolved in a single parallel wave with in-memory lookups replacing the second network round trip.

## Problem

Both services used a **2-wave pattern**:

- **Wave 1**: Independent queries run in parallel
- **Wave 2**: Two sub-queries (`recentSaleItems` + `catalogProducts`) that depend on top product IDs from Wave 1

Each wave costs ~450–500 ms of network round-trip time to the remote Supabase endpoint (`ap-northeast-2`). Wave 2 was adding a full RTT even though the individual queries execute in <1 ms on PostgreSQL.

## Solution

**Technique**: Remove the `productId` filter from Wave 2 queries so they no longer depend on Wave 1 results, then move them into Wave 1.

### Dashboard (`getDashboardStats`)

| | Before | After |
|---|---|---|
| Waves | 2 (5 queries + 2 queries) | 1 (6 queries) |
| Total queries | 7 | 6 |

Changes:
1. Added `price: true` to the existing `activeProducts` select — catalog attributes (price, iconName) are now resolved from this already-fetched data
2. Added unfiltered `allRecentSnapshots` query to Wave 1 — returns latest `SaleItem.productName` per product without needing top product IDs
3. Removed Wave 2 `await Promise.all()` — replaced with in-memory Map lookups

### Reports (`getReportData`)

| | Before | After |
|---|---|---|
| Waves | 2 (10 queries + 2 queries) | 1 (12 queries) |
| Total queries | 12 | 12 |

Changes:
1. Added unfiltered `periodSnapshots` query to Wave 1 — snapshot names for all products in period (keeps date range filter, drops productId filter)
2. Added unfiltered `allProductIcons` query to Wave 1 — all products' iconName
3. Removed Wave 2 `await Promise.all()` — replaced with in-memory Map lookups

## Benchmark Results

5 warmups + 10 measured runs against remote Supabase endpoint.

### Dashboard

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Min | 949 ms | 472 ms | −50.3% |
| **Median** | **1,006 ms** | **484 ms** | **−51.9%** |
| Average | 1,046 ms | 483 ms | −53.8% |
| Max | 1,339 ms | 495 ms | −63.0% |

### Reports

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Min | 1,373 ms | 904 ms | −34.2% |
| **Median** | **1,393 ms** | **914 ms** | **−34.4%** |
| Average | 1,533 ms | 926 ms | −39.6% |
| Max | 2,132 ms | 998 ms | −53.2% |

## Data Equivalence Verification

Both services produce **byte-identical JSON output** comparing the before and after implementations:

- ✅ Dashboard top products: IDENTICAL
- ✅ Dashboard low stock products: IDENTICAL
- ✅ Dashboard product count: IDENTICAL
- ✅ Reports top products: IDENTICAL

## Validation

- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npx next build` — compiled successfully
- ✅ Data equivalence — all checks pass

## Files Modified

| File | Change |
|------|--------|
| `lib/services/dashboard.ts` | Added `price: true` to activeProducts select; added unfiltered snapshot query to Wave 1; replaced Wave 2 with in-memory resolution |
| `lib/services/reports.ts` | Added 2 unfiltered queries to Wave 1 (period snapshots + product icons); replaced Wave 2 with in-memory resolution |

## Trade-offs

The unfiltered queries return slightly more rows than the filtered originals:
- Dashboard snapshots: all products with sales (~10–20 rows) vs exactly 4
- Reports snapshots: all products sold in period vs exactly 6
- Reports product icons: all products (92 rows) vs exactly 6

This extra data is negligible (<5 KB) and the in-memory Map lookup is O(1). The trade-off eliminates ~450–500 ms of network latency per request.

## Cumulative Progress (Phase 1–4)

| Phase | Focus | Key Improvement |
|-------|-------|-----------------|
| 1 | Auth dedup + lightweight queries | ~40–55% lower simulated server execution |
| 2 | Navigation loading skeletons | Instant perceived navigation |
| 3 | Database audit (read-only) | Confirmed <1 ms PostgreSQL execution |
| 4 | Wave elimination | **~52% faster dashboard, ~34% faster reports** |
