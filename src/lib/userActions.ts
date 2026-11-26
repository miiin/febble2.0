'use server';

// 하트(찜)·팔로우·담기 저장. 로그인한 사용자 본인 것만 바꾼다.
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { artistFollows, showLikes, slotPicks, users } from '@/db/schema';

async function requireUserId() {
  const userId = (await auth())?.user?.id;
  if (!userId) throw new Error('로그인이 필요해요');
  return userId;
}

export async function setShowLiked(showId: string, liked: boolean) {
  const userId = await requireUserId();
  if (liked) await db.insert(showLikes).values({ userId, showId }).onConflictDoNothing();
  else await db.delete(showLikes).where(and(eq(showLikes.userId, userId), eq(showLikes.showId, showId)));
}

export async function setArtistFollowed(artistId: string, followed: boolean) {
  const userId = await requireUserId();
  if (followed) await db.insert(artistFollows).values({ userId, artistId }).onConflictDoNothing();
  else await db.delete(artistFollows).where(and(eq(artistFollows.userId, userId), eq(artistFollows.artistId, artistId)));
}

export async function setSlotPicked(slotId: string, picked: boolean) {
  const userId = await requireUserId();
  const id = Number(slotId);
  if (picked) await db.insert(slotPicks).values({ userId, slotId: id }).onConflictDoNothing();
  else await db.delete(slotPicks).where(and(eq(slotPicks.userId, userId), eq(slotPicks.slotId, id)));
}

/** Following 화면을 봤다고 기록한다. 다음에 볼 때 이 시각 이후에 공개된 공연에만 NEW 가 붙는다. */
export async function markFollowingSeen() {
  const userId = await requireUserId();
  await db.update(users).set({ followingSeenAt: new Date() }).where(eq(users.id, userId));
}
