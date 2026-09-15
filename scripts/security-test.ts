import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { requireAuth, getCurrentUser } from '../lib/auth/guard';
import { getProductsAction, adjustStockAction } from '../app/actions/products';
import { getDashboardStatsAction } from '../app/actions/dashboard';
import { createSaleAction } from '../app/actions/sales';
import { createExpenseAction, getExpensesAction } from '../app/actions/expenses';
import { createPurchaseAction, getPurchasesAction } from '../app/actions/purchases';
import { createSupplierAction, getSuppliersAction } from '../app/actions/suppliers';

// Helper to set/clear global mock test headers
function setMockHeaders(headers: Headers | null) {
  if (headers) {
    (globalThis as unknown as { __AUTH_TEST_HEADERS__?: Headers }).__AUTH_TEST_HEADERS__ = headers;
  } else {
    delete (globalThis as unknown as { __AUTH_TEST_HEADERS__?: Headers }).__AUTH_TEST_HEADERS__;
  }
}

async function runSecurityTests() {
  console.log('=== STARTING WARUNG APP RBAC & AUTH SECURITY TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName} -> ${detail || ''}`);
      failed++;
    }
  }

  // Ensure no mock headers are active at start
  setMockHeaders(null);

  // 1. Direct Server Action invocation without session -> must return UNAUTHORIZED
  console.log('--- Test Suite 1: Anonymous / Unauthenticated Direct Invocations ---');
  const unauthProducts = await getProductsAction();
  assert(
    !unauthProducts.success && unauthProducts.error.code === 'UNAUTHORIZED',
    'Anonymous call to getProductsAction() returns UNAUTHORIZED'
  );

  const unauthStats = await getDashboardStatsAction();
  assert(
    !unauthStats.success && unauthStats.error.code === 'UNAUTHORIZED',
    'Anonymous call to getDashboardStatsAction() returns UNAUTHORIZED'
  );

  const unauthSale = await createSaleAction({ items: [], paymentAmount: 0 });
  assert(
    !unauthSale.success && unauthSale.error.code === 'UNAUTHORIZED',
    'Anonymous call to createSaleAction() returns UNAUTHORIZED'
  );

  const unauthExpense = await createExpenseAction({
    expenseDate: '2026-09-15',
    category: 'operasional',
    amount: 1000,
  });
  assert(
    !unauthExpense.success && unauthExpense.error.code === 'UNAUTHORIZED',
    'Anonymous call to createExpenseAction() returns UNAUTHORIZED'
  );

  const unauthPurchase = await createPurchaseAction({
    purchaseDate: '2026-09-15',
    items: [],
  });
  assert(
    !unauthPurchase.success && unauthPurchase.error.code === 'UNAUTHORIZED',
    'Anonymous call to createPurchaseAction() returns UNAUTHORIZED'
  );

  const unauthSupplier = await createSupplierAction({ name: 'Hacker Supplier' });
  assert(
    !unauthSupplier.success && unauthSupplier.error.code === 'UNAUTHORIZED',
    'Anonymous call to createSupplierAction() returns UNAUTHORIZED'
  );

  const unauthAdjust = await adjustStockAction({
    productId: 'non-existent',
    type: 'add',
    amount: 5,
    reason: 'pembelian',
  });
  assert(
    !unauthAdjust.success && unauthAdjust.error.code === 'UNAUTHORIZED',
    'Anonymous call to adjustStockAction() returns UNAUTHORIZED'
  );

  // 2. Database User & Roles Verification
  console.log('\n--- Test Suite 2: Database Account & RBAC Roles Verification ---');
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@warung.local';
  const ownerEmail = process.env.BOOTSTRAP_OWNER_EMAIL || 'owner@warung.local';

  const adminUser = await prisma.user.findFirst({
    where: { email: adminEmail },
  });
  assert(
    !!adminUser && adminUser.role === 'ADMIN' && adminUser.isActive === true,
    'Initial ADMIN user exists with role ADMIN and isActive true'
  );

  const ownerUser = await prisma.user.findFirst({
    where: { email: ownerEmail },
  });
  assert(
    !!ownerUser && ownerUser.role === 'OWNER' && ownerUser.isActive === true,
    'Initial OWNER user exists with role OWNER and isActive true'
  );

  // 3. Password Verification via Better Auth API
  console.log('\n--- Test Suite 3: Better Auth Password Authentication Flow ---');
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const ownerPassword = process.env.BOOTSTRAP_OWNER_PASSWORD;

  if (!adminPassword || !ownerPassword) {
    console.error('FAIL: BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_OWNER_PASSWORD environment variables are required for testing.');
    process.exit(1);
  }

  const loginAdminRes = await auth.api.signInEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
    },
    asResponse: true,
  });
  assert(
    loginAdminRes.ok,
    'Better Auth authenticates valid admin credentials'
  );

  const loginOwnerRes = await auth.api.signInEmail({
    body: {
      email: ownerEmail,
      password: ownerPassword,
    },
    asResponse: true,
  });
  assert(
    loginOwnerRes.ok,
    'Better Auth authenticates valid owner credentials'
  );

  const wrongLogin = await auth.api
    .signInEmail({
      body: {
        email: adminEmail,
        password: 'IncorrectInvalidPassword999!',
      },
    })
    .catch((err) => err);
  assert(
    !wrongLogin?.token,
    'Better Auth rejects invalid password credentials'
  );

  // 4. Authenticated OWNER RBAC Restriction Tests (Must return FORBIDDEN)
  console.log('\n--- Test Suite 4: Authenticated OWNER Server Action Restrictions ---');
  const ownerCookie = loginOwnerRes.headers.get('set-cookie');
  if (!ownerCookie) {
    console.error('FAIL: No set-cookie header in owner login response');
    process.exit(1);
  }

  const ownerHeaders = new Headers({
    cookie: ownerCookie,
  });
  setMockHeaders(ownerHeaders);

  const ownerSale = await createSaleAction({ items: [], paymentAmount: 0 });
  assert(
    !ownerSale.success && ownerSale.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling createSaleAction() returns FORBIDDEN',
    JSON.stringify(ownerSale)
  );

  const ownerAdjust = await adjustStockAction({
    productId: 'non-existent',
    type: 'add',
    amount: 1,
    reason: 'pembelian',
  });
  assert(
    !ownerAdjust.success && ownerAdjust.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling adjustStockAction() returns FORBIDDEN',
    JSON.stringify(ownerAdjust)
  );

  const ownerDashboard = await getDashboardStatsAction();
  assert(
    !ownerDashboard.success && ownerDashboard.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling getDashboardStatsAction() returns FORBIDDEN'
  );

  const ownerProducts = await getProductsAction();
  assert(
    !ownerProducts.success && ownerProducts.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling getProductsAction() returns FORBIDDEN'
  );

  const ownerPurchases = await getPurchasesAction();
  assert(
    !ownerPurchases.success && ownerPurchases.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling getPurchasesAction() returns FORBIDDEN'
  );

  const ownerExpenses = await getExpensesAction();
  assert(
    !ownerExpenses.success && ownerExpenses.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling getExpensesAction() returns FORBIDDEN'
  );

  const ownerSuppliers = await getSuppliersAction();
  assert(
    !ownerSuppliers.success && ownerSuppliers.error.code === 'FORBIDDEN',
    'Authenticated OWNER calling getSuppliersAction() returns FORBIDDEN'
  );

  // 5. Inactive User Session Rejection
  console.log('\n--- Test Suite 5: Inactive User Enforcement ---');
  const tempInactiveEmail = `inactive_test_${Date.now()}@warung.local`;
  const tempUserRes = await auth.api.signUpEmail({
    body: {
      name: 'Temporary Inactive User',
      email: tempInactiveEmail,
      password: 'TemporaryTestPassword123!',
    },
  });

  if (!tempUserRes?.user) {
    console.error('FAIL: Could not create temporary test user');
    process.exit(1);
  }

  try {
    // Mark as inactive in DB
    await prisma.user.update({
      where: { id: tempUserRes.user.id },
      data: { isActive: false },
    });

    const inactiveLoginRes = await auth.api.signInEmail({
      body: {
        email: tempInactiveEmail,
        password: 'TemporaryTestPassword123!',
      },
      asResponse: true,
    });

    const inactiveCookie = inactiveLoginRes.headers.get('set-cookie') || '';
    const inactiveHeaders = new Headers({
      cookie: inactiveCookie,
    });

    // Verify getCurrentUser rejects inactive account
    const resolvedUser = await getCurrentUser(inactiveHeaders);
    assert(
      resolvedUser === null,
      'Inactive user session is rejected by getCurrentUser (returns null)'
    );

    // Verify requireAuth yields UNAUTHORIZED
    const authCheck = await requireAuth(inactiveHeaders);
    assert(
      !authCheck.success && (authCheck.errorResult as { success: false; error: { code: string; message: string } }).error.code === 'UNAUTHORIZED',
      'Inactive user request yields UNAUTHORIZED via requireAuth'
    );
  } finally {
    // Cleanup temporary test user & sessions
    await prisma.session.deleteMany({ where: { userId: tempUserRes.user.id } });
    await prisma.account.deleteMany({ where: { userId: tempUserRes.user.id } });
    await prisma.user.delete({ where: { id: tempUserRes.user.id } });
  }

  // 6. Session Invalidation & Sign-Out Test
  console.log('\n--- Test Suite 6: Session Invalidation on Logout ---');
  const tempLogoutEmail = `logout_test_${Date.now()}@warung.local`;
  const tempLogoutUser = await auth.api.signUpEmail({
    body: {
      name: 'Temporary Logout User',
      email: tempLogoutEmail,
      password: 'TemporaryLogoutPassword123!',
    },
  });

  try {
    const activeSessionRes = await auth.api.signInEmail({
      body: {
        email: tempLogoutEmail,
        password: 'TemporaryLogoutPassword123!',
      },
      asResponse: true,
    });

    const logoutCookie = activeSessionRes.headers.get('set-cookie') || '';
    const logoutHeaders = new Headers({
      cookie: logoutCookie,
    });

    const beforeLogout = await auth.api.getSession({ headers: logoutHeaders });
    assert(
      !!beforeLogout?.session,
      'Active session resolves before sign-out'
    );

    // Perform sign out
    await auth.api.signOut({ headers: logoutHeaders });

    const afterLogout = await auth.api.getSession({ headers: logoutHeaders });
    assert(
      !afterLogout?.session,
      'Session resolves to null after sign-out (session token invalidated)'
    );
  } finally {
    // Cleanup temporary logout user
    if (tempLogoutUser?.user?.id) {
      await prisma.session.deleteMany({ where: { userId: tempLogoutUser.user.id } });
      await prisma.account.deleteMany({ where: { userId: tempLogoutUser.user.id } });
      await prisma.user.delete({ where: { id: tempLogoutUser.user.id } });
    }
  }

  // Reset mock headers
  setMockHeaders(null);

  console.log(`\n=== ALL SECURITY TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error('Security test runner error:', err);
  process.exit(1);
});
