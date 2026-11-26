'use server';

// KOPIS 공연 가져오기(어드민 버튼)와 출연진 채우기. 가져오는 일은 매일 크론도 한다 (api/cron/kopis).
import { and, asc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { CAST_BATCH, fillCast } from '@/lib/admin/kopisCast';
import { runKopisImport } from '@/lib/admin/kopisImport';

export async function importFromKopis(): Promise<{ added?: number; total?: number; error?: string }> {
  await assertAdmin();
  let result;
  try {
    // 새로 가져온 공연은 출연진도 받아 둔다.
    result = await runKopisImport();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'KOPIS 에서 가져오지 못했어요' };
  }
  revalidatePath('/admin/reports');
  return result;
}

/** 처리 전 KOPIS 공연 중 출연진을 아직 받지 않은 공연을 날짜순으로 CAST_BATCH 개씩 채운다. */
export async function fillKopisCast(): Promise<{ filled: number; remaining: number; error?: string }> {
  await assertAdmin();
  const pending = and(eq(reports.source, 'kopis'), eq(reports.status, 'pending'), isNull(reports.cast));
  const rows = await db.select({ id: reports.id }).from(reports).where(pending).orderBy(asc(reports.date)).limit(CAST_BATCH);
  const filled = await fillCast(rows.map((row) => row.id));
  const remaining = await db.$count(reports, pending);
  revalidatePath('/admin/reports');
  return { filled, remaining, error: rows.length && !filled ? 'KOPIS 에서 출연진을 받지 못했어요. 잠시 뒤 다시 시도해주세요.' : undefined };
}
