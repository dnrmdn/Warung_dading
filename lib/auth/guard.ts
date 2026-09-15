import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ActionResult } from '@/app/actions/types';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

/**
 * Server-authoritative resolution of authenticated user and active state.
 */
export async function getCurrentUser(
  mockHeaders?: Headers
): Promise<AuthenticatedUser | null> {
  try {
    const activeHeaders =
      mockHeaders ??
      ((globalThis as unknown as { __AUTH_TEST_HEADERS__?: Headers }).__AUTH_TEST_HEADERS__) ??
      (await headers());

    const session = await auth.api.getSession({
      headers: activeHeaders,
    });

    if (!session?.user) return null;

    const user = session.user as unknown as {
      id: string;
      name: string;
      email: string;
      role?: Role;
      isActive?: boolean;
    };

    // Strict server-authoritative check: deactivated users are rejected
    if (user.isActive !== true) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as Role) || Role.ADMIN,
      isActive: true,
    };
  } catch (error: unknown) {
    // Next.js uses thrown errors for dynamic bailouts and redirects; don't swallow them
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest: unknown }).digest === 'string'
    ) {
      const digest = (error as { digest: string }).digest;
      if (digest === 'DYNAMIC_SERVER_USAGE' || digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }

    console.error('[Auth Guard Error]:', error);
    return null;
  }
}

/**
 * Enforces valid session + active account state.
 */
export async function requireAuth(mockHeaders?: Headers): Promise<
  | { success: true; user: AuthenticatedUser }
  | { success: false; errorResult: ActionResult<never> }
> {
  const user = await getCurrentUser(mockHeaders);
  if (!user) {
    return {
      success: false,
      errorResult: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.',
        },
      },
    };
  }
  return { success: true, user };
}

/**
 * Enforces valid session + active account + required role.
 */
export async function requireRole(
  allowedRoles: Role[],
  mockHeaders?: Headers
): Promise<
  | { success: true; user: AuthenticatedUser }
  | { success: false; errorResult: ActionResult<never> }
> {
  const authCheck = await requireAuth(mockHeaders);
  if (!authCheck.success) return authCheck;

  if (!allowedRoles.includes(authCheck.user.role)) {
    return {
      success: false,
      errorResult: {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini.',
        },
      },
    };
  }

  return authCheck;
}

/**
 * Shorthand guard for ADMIN-only operations.
 */
export async function requireAdmin(mockHeaders?: Headers) {
  return requireRole([Role.ADMIN], mockHeaders);
}

/**
 * Shorthand guard for Report access (ADMIN + OWNER).
 */
export async function requireReportAccess(mockHeaders?: Headers) {
  return requireRole([Role.ADMIN, Role.OWNER], mockHeaders);
}

