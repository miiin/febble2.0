'use server';

// 포스터 이미지를 Claude 가 읽어 공연 정보 초안을 만든다. 어드민 공연 폼을 미리 채우는 데만 쓰고,
// 저장은 사람이 확인한 뒤 한다.
import { readImage, todayInSeoul } from '@/lib/admin/ai';
import { assertAdmin } from '@/lib/admin/guard';
import { listArtistOptions, listShowOptions } from '@/lib/admin/queries';
import { artistListText, cleanShowDraft, type ShowDraft, ShowDraftSchema, showDraftSystem } from '@/lib/admin/showDraft';
import { getObjectBytes, keyFromUrl } from '@/lib/storage';

export type DraftResult = { draft?: ShowDraft; error?: string };

/** url: 어드민에서 올린 R2 이미지 주소 */
export async function readPoster(url: string): Promise<DraftResult> {
  await assertAdmin();
  const key = keyFromUrl(url);
  if (!key) return { error: '먼저 포스터를 이 화면에서 올려주세요' };

  const [image, artists, shows] = await Promise.all([getObjectBytes(key), listArtistOptions(), listShowOptions()]);
  const result = await readImage({
    label: '포스터',
    schema: ShowDraftSchema,
    system: showDraftSystem('공연 포스터 이미지'),
    image,
    mediaType: 'image/webp',
    text: `오늘 날짜: ${todayInSeoul()} (Asia/Seoul)\n\n${artistListText(artists)}\n\n이 포스터의 공연 정보를 읽어줘.`,
  });
  return result.data
    ? { draft: cleanShowDraft(result.data, new Set(artists.map((a) => a.id)), new Set(shows.map((s) => s.id))) }
    : { error: result.error };
}
