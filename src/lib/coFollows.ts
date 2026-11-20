// 같이 팔로우: 두 아티스트를 모두 팔로우한 사람 수. For you 추천 순서에만 쓰고 화면에는 드러내지 않는다.
// 사람 수가 적은 짝은 추천에 의미가 없고, 특정 사용자의 팔로우를 짐작하게 할 수 있어 빼고 읽는다.
import 'server-only';
import { sql } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/db';

export const MIN_CO_FOLLOWERS = 3;

export type CoFollows = {
  /** { [artistId]: { [otherArtistId]: 같이 팔로우한 사람 수 } } (양방향) */
  both: Record<string, Record<string, number>>;
  /** 아티스트별 팔로워 수. 같은 시점에 읽어야 점수가 맞아서 카탈로그 숫자를 쓰지 않는다. */
  followers: Record<string, number>;
};

export async function getCoFollows(): Promise<CoFollows> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  const [pairs, totals] = await Promise.all([
    db.execute<{ a: string; b: string; n: number }>(sql`
      SELECT x.artist_id AS a, y.artist_id AS b, count(*)::int AS n
      FROM artist_follows x
      JOIN artist_follows y ON y.user_id = x.user_id AND y.artist_id <> x.artist_id
      GROUP BY 1, 2
      HAVING count(*) >= ${MIN_CO_FOLLOWERS}`),
    db.execute<{ id: string; n: number }>(sql`SELECT artist_id AS id, count(*)::int AS n FROM artist_follows GROUP BY 1`),
  ]);
  const coFollows: CoFollows = { both: {}, followers: {} };
  for (const { a, b, n } of pairs.rows) (coFollows.both[a] ??= {})[b] = n;
  for (const { id, n } of totals.rows) coFollows.followers[id] = n;
  return coFollows;
}
