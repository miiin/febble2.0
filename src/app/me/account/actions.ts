'use server';

import { eq } from 'drizzle-orm';
import { auth, signOut } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

/** 회원 탈퇴. 계정·세션·팔로우·찜·담은 무대는 FK cascade 로 같이 지워지고, 제보는 작성자만 비운다. */
export async function deleteAccount() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await db.delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: '/' });
}
