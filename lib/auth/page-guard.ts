import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { getCurrentUser, AuthenticatedUser } from './guard';

/**
 * Server-authoritative page protection helper for Server Components.
 * Redirects unauthenticated users to /login and unauthorized users to /laporan or /login.
 */
export async function enforcePageRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === Role.OWNER) {
      redirect('/laporan');
    }
    redirect('/login');
  }

  return user;
}

export async function enforceAdminPage(): Promise<AuthenticatedUser> {
  return enforcePageRole([Role.ADMIN]);
}

export async function enforceReportPage(): Promise<AuthenticatedUser> {
  return enforcePageRole([Role.ADMIN, Role.OWNER]);
}
