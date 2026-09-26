'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getDashboardStats,
  markHppChangeAsRead,
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

export async function markHppChangeAsReadAction(
  id: string
): Promise<ActionResult<void>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  if (!id || typeof id !== 'string') {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ID catatan perubahan HPP tidak valid.',
      },
    };
  }

  try {
    await markHppChangeAsRead(id);
    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[Dashboard Action Error]:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.',
      },
    };
  }
}
