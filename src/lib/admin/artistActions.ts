'use server';

import { eq } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { type ActionResult, check, InputError, isReferenced, optional, pgCode, SLUG_RE, text, toResult } from '@/lib/admin/validate';

/** 새로 만들 때만 id 를 받는다. 주소와 다른 테이블이 id 를 쓰므로 만든 뒤에는 바꾸지 않는다. */
export async function saveArtist(existingId: string | null, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  try {
    const id = existingId ?? text(formData, 'id');
    const name = text(formData, 'name');
    check(SLUG_RE.test(id), 'id 는 영문 소문자·숫자·하이픈으로 적어주세요 (예: silica-gel)');
    check(name, '이름을 적어주세요');

    const values = {
      name,
      image: optional(text(formData, 'image')),
      genres: text(formData, 'genres')
        .split(',')
        .map((genre) => genre.trim())
        .filter(Boolean),
      bio: text(formData, 'bio'),
      isEditorPick: formData.get('isEditorPick') === 'on',
      spotifyArtistId: optional(text(formData, 'spotifyArtistId')),
    };

    if (existingId) {
      await db.update(artists).set(values).where(eq(artists.id, existingId));
    } else {
      try {
        await db.insert(artists).values({ id, ...values });
      } catch (error) {
        if (pgCode(error) === '23505') throw new InputError(`이미 있는 id 예요: ${id}`);
        throw error;
      }
    }
  } catch (error) {
    return toResult(error);
  }
  updateTag('catalog');
  return { id: existingId ?? text(formData, 'id') };
}

export async function deleteArtist(id: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.delete(artists).where(eq(artists.id, id));
  } catch (error) {
    if (isReferenced(error)) return { error: '라인업이나 타임테이블에 들어간 아티스트는 지울 수 없어요. 공연에서 먼저 빼주세요.' };
    throw error;
  }
  updateTag('catalog');
  return { id };
}
