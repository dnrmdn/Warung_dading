'use server';

import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getDashboardStats,
  DashboardStats,
} from '@/lib/services/dashboard';

export async function getDashboardStatsAction(
  dateOverride?: string
): Promise<ActionResult<DashboardStats>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getDashboardStats(dateOverride);
    return { success: true, data };
  } catch (error) {
    console.error('[Dashboard Action Error]:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan sistem saat memuat ringkasan dashboard. Silakan coba lagi.',
      },
    };
  }
}
