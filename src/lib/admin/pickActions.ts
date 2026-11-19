'use server';

import { eq } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { db } from '@/db';
import { pickIssues, pickItems } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { type ActionResult, check, DATE_RE, InputError, pgCode, toResult } from '@/lib/admin/validate';

export type PickInput = {
  vol: number;
  publishedAt: string;
  curator: string;
  isPublished: boolean;
  /** 첫 번째가 메인 */
  items: { showId: string; description: string }[];
};

export async function savePick(existingVol: number | null, input: PickInput): Promise<ActionResult> {
  await assertAdmin();
  const vol = existingVol ?? input.vol;
  try {
    check(Number.isInteger(vol) && vol > 0, '호수를 숫자로 적어주세요');
    check(DATE_RE.test(input.publishedAt), '발행일을 골라주세요');
    check(input.curator.trim(), '큐레이터를 적어주세요');
    check(input.items.length > 0, '메인 공연을 골라주세요');
    for (const item of input.items) check(item.showId && item.description.trim(), '고른 공연과 코멘트를 모두 채워주세요');
    check(new Set(input.items.map((item) => item.showId)).size === input.items.length, '같은 공연이 두 번 들어갔어요');

    const values = { publishedAt: input.publishedAt, curator: input.curator.trim(), isPublished: input.isPublished };
    await db.transaction(async (tx) => {
      if (existingVol) {
        await tx.update(pickIssues).set(values).where(eq(pickIssues.vol, vol));
      } else {
        try {
          await tx.insert(pickIssues).values({ vol, ...values });
        } catch (error) {
          if (pgCode(error) === '23505') throw new InputError(`이미 있는 호예요: Vol.${vol}`);
          throw error;
        }
      }
      // 항목은 다른 곳에서 참조하지 않아 통째로 바꾼다.
      await tx.delete(pickItems).where(eq(pickItems.issueVol, vol));
      await tx
        .insert(pickItems)
        .values(input.items.map((item, position) => ({ issueVol: vol, showId: item.showId, description: item.description.trim(), isMain: position === 0, position })));
    });
  } catch (error) {
    return toResult(error);
  }
  updateTag('catalog');
  return { id: String(vol) };
}

export async function deletePick(vol: number): Promise<ActionResult> {
  await assertAdmin();
  await db.delete(pickIssues).where(eq(pickIssues.vol, vol));
  updateTag('catalog');
  return { id: String(vol) };
}
