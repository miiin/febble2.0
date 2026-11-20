'use server';

// KOPIS 에서 앞으로 열릴 대중음악 공연을 가져와 제보(승인 대기)로 넣는다.
// 이미 가져온 공연(넘긴 것 포함)은 KOPIS ID 로 건너뛴다. 공연으로 만들지는 어드민이 고른다.
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { todayInSeoul } from '@/lib/admin/ai';
import { assertAdmin } from '@/lib/admin/guard';
import { addDays, listPopularMusic } from '@/lib/kopis';

const DAYS_AHEAD = 60;

export async function importFromKopis(): Promise<{ added?: number; total?: number; error?: string }> {
  await assertAdmin();
  const from = todayInSeoul();

  let items;
  try {
    items = await listPopularMusic(from, addDays(from, DAYS_AHEAD));
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'KOPIS 에서 가져오지 못했어요' };
  }
  if (items.length === 0) return { added: 0, total: 0 };

  const inserted = await db
    .insert(reports)
    .values(
      items.map((item) => ({
        source: 'kopis' as const,
        externalId: item.id,
        title: item.title,
        date: item.startDate === item.endDate ? item.startDate : `${item.startDate} ~ ${item.endDate}`,
        venue: item.area ? `${item.venue} (${item.area})` : item.venue,
        poster: item.poster,
      })),
    )
    .onConflictDoNothing({ target: reports.externalId })
    .returning({ id: reports.id });

  revalidatePath('/admin/reports');
  return { added: inserted.length, total: items.length };
}
