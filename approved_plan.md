# Final Phase 2G.1-E Implementation Plan — Warung App

```text
AUTH ARCHITECTURE: BETTER AUTH
LOGIN: EMAIL + PASSWORD
STATUS: PLAN ONLY
IMPLEMENTATION: NOT STARTED
```

---

## 1. Summary of Final Architectural Corrections

1. **Email + Password Only:** All references to usernames, username plugins, or canonical local domains are eliminated. The system relies strictly on standard `email` + `password` supported by Better Auth's `emailAndPassword` provider.
2. **Server-Authoritative `isActive` Enforcement:** Account status is never delegated to client assumptions or passive cookie checks. The server-side authorization layer (`getCurrentUser()`) explicitly inspects `user.isActive === true` from the database session on every Server Action and Server Component. Any account with `isActive === false` returns `UNAUTHORIZED` and triggers a redirect to `/login`.
3. **De-mystified Route Protection:** Cookie presence is explicitly acknowledged as **NOT** an authorization boundary (cookies can be expired, tampered with, or belong to deactivated accounts). In Next.js 16.3.5, Next.js Edge middleware is used solely as an early UX routing hint (preventing blank flashes on obvious unauthenticated visits). The **real, authoritative security boundaries** are:
   - **Server Components (Layouts & Pages):** Resolves the authoritative Better Auth session and redirects unauthenticated or unauthorized users (`OWNER` navigating to operational modules).
   - **Server Action Boundaries (`lib/auth/guard.ts`):** Evaluates `getCurrentUser()` and enforces role permissions before executing any business service.
4. **Hardened Bootstrap Process:** Initial credentials are never stored in code, never logged, and never silently seeded on server startup. The initial `ADMIN` and `OWNER` creation is handled by a standalone, manual CLI script (`scripts/bootstrap-auth.ts`) that verifies whether users already exist before taking any action. If users exist, it safely aborts without modifying or downgrading existing accounts.
5. **Exact Better Auth API Conf
<truncated 16702 bytes>
roductAction()`, `updateProductAction()`, `deleteProductAction()` -> Returns `FORBIDDEN`.
- [ ] `OWNER` caller invokes `createPurchaseAction()`, `createExpenseAction()`, `createSupplierAction()` -> Returns `FORBIDDEN`.
- [ ] `OWNER` caller invokes `getDashboardStatsAction()` -> Returns `FORBIDDEN`.
- [ ] `ADMIN` caller invokes mutations -> Succeeded.

---

## 13. Implementation Sequence

```text
1. Install better-auth in package.json
2. Update prisma/schema.prisma with Better Auth models
3. Run prisma migration & generate client
4. Configure BETTER_AUTH_SECRET in .env
5. Create lib/auth.ts (Better Auth server config)
6. Create lib/auth-client.ts (Better Auth client SDK)
7. Create app/api/auth/[...all]/route.ts
8. Create scripts/bootstrap-auth.ts and execute initial user bootstrap
9. Create lib/auth/guard.ts (getCurrentUser, requireAuth, requireAdmin)
10. Update app/actions/types.ts with UNAUTHORIZED and FORBIDDEN error codes
11. Apply guards to all 24 actions in app/actions/**
12. Create middleware.ts (early UX cookie redirect)
13. Enforce Server Component route checks on operational pages
14. Create app/login/page.tsx UI
15. Update navigation UI (hide bottom nav & FAB for OWNER, add logout button)
16. Execute TypeScript validation (npx tsc --noEmit) and linting
17. Run security test matrix
```

---

## 14. Final Acceptance Criteria

*(Strictly Plan-Only: All criteria remain unchecked)*

```text
[ ] Better Auth authentication implemented
[ ] Email/password login implemented
[ ] ADMIN role implemented
[ ] OWNER role implemented
[ ] Route authorization implemented
[ ] Server Action authorization implemented
[ ] Login implemented
[ ] Logout implemented
[ ] Initial bootstrap implemented
[ ] OWNER restricted to reports
[ ] ADMIN retains full access
[ ] Direct URL bypass prevented
[ ] Direct Server Action bypass prevented
[ ] Inactive-user access prevented
[ ] Session invalidation verified
[ ] TypeScript passes
[ ] Build passes
[ ] Security test matrix passes
```

---

```text
READY FOR IMPLEMENTATION APPROVAL: YES
```