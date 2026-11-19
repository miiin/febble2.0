// 로그인한 사용자와 그 사람의 팔로우·찜·담은 무대. 세션(쿠키)을 읽으므로 <Suspense> 안에서 부른다.
import 'server-only';
import { eq } from 'drizzle-orm';
import { connection } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { accounts, artistFollows, showLikes, slotPicks, timetableSlots, users } from '@/db/schema';

export type LoginProvider = 'kakao' | 'google';

export const PROVIDER_LABEL: Record<LoginProvider, string> = { kakao: '카카오', google: 'Google' };

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  image?: string;
  provider: LoginProvider;
  joinedAt: string; // 'YYYY-MM-DD'
  isAdmin: boolean;
};

/** 로그인 안 했으면 null */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // auth() 가 CSRF 토큰용 난수를 만든다. 요청 시점에 실행된다고 Next 에 알려야 prerender 오류가 안 난다.
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
      role: users.role,
      provider: accounts.provider,
    })
    .from(users)
    .leftJoin(accounts, eq(accounts.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name ?? '페블러',
    email: row.email ?? undefined,
    image: row.image ?? undefined,
    provider: (row.provider ?? 'google') as LoginProvider,
    joinedAt: row.createdAt.toISOString().slice(0, 10),
    isAdmin: row.role === 'admin',
  };
}

export async function getFollowedArtistIds(userId: string) {
  const rows = await db
    .select({ artistId: artistFollows.artistId })
    .from(artistFollows)
    .where(eq(artistFollows.userId, userId))
    .orderBy(artistFollows.createdAt);
  return rows.map((row) => row.artistId);
}

export async function getLikedShowIds(userId: string) {
  const rows = await db.select({ showId: showLikes.showId }).from(showLikes).where(eq(showLikes.userId, userId));
  return rows.map((row) => row.showId);
}

/** 공연별 담은 무대 id */
export async function getPickedSlotIds(userId: string) {
  const rows = await db
    .select({ showId: timetableSlots.showId, slotId: slotPicks.slotId })
    .from(slotPicks)
    .innerJoin(timetableSlots, eq(timetableSlots.id, slotPicks.slotId))
    .where(eq(slotPicks.userId, userId));

  const picked: Record<string, string[]> = {};
  for (const row of rows) (picked[row.showId] ??= []).push(String(row.slotId));
  return picked;
}
