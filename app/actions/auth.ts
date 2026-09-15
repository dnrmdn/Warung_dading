'use server';

import { getCurrentUser } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import { Role } from '@prisma/client';

export interface UserSessionInfo {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Server action to retrieve the authenticated user's session role and info.
 * Resolves session and active status server-authoritatively via Better Auth.
 */
export async function getSessionUserAction(): Promise<ActionResult<UserSessionInfo | null>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
