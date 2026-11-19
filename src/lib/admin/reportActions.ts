'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';

const STATUSES = ['pending', 'added', 'rejected'] as const;

export async function setReportStatus(id: number, status: (typeof STATUSES)[number]) {
  await assertAdmin();
  if (!STATUSES.includes(status)) throw new Error('알 수 없는 상태예요');
  await db.update(reports).set({ status }).where(eq(reports.id, id));
  revalidatePath('/admin/reports');
}
