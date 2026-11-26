// KOPIS 에서 앞으로 열릴 대중음악 공연을 가져와 제보(승인 대기)로 넣는다. 어드민 버튼과 매일 도는 크론이 같이 쓴다.
// 이미 가져온 공연(넘긴 것 포함)은 KOPIS ID 로 건너뛴다. 공연으로 만들지는 어드민이 고른다. 서버에서만 쓴다.
import 'server-only';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { todayInSeoul } from '@/lib/admin/ai';
import { fillCast } from '@/lib/admin/kopisCast';
import { addDays, listPopularMusic } from '@/lib/kopis';

const DAYS_AHEAD = 60;

/** castLimit: 새로 가져온 공연 중 출연진을 바로 받을 최대 수 (남은 것은 '출연진 채우기'로). 실패하면 던진다. */
export async function runKopisImport(castLimit = Infinity) {
  const from = todayInSeoul();
  const items = await listPopularMusic(from, addDays(from, DAYS_AHEAD));
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

  if (inserted.length) await fillCast(inserted.slice(0, castLimit).map((row) => row.id));
  return { added: inserted.length, total: items.length };
}
