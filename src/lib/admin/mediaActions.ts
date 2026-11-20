'use server';

// 어드민 이미지 업로드: 줄이고(긴 변 1600px) webp 로 바꿔 R2 에 올린다.
import sharp from 'sharp';
import { assertAdmin } from '@/lib/admin/guard';
import { putObject } from '@/lib/storage';

const FOLDERS = ['shows', 'artists'] as const;
const MAX_BYTES = 4 * 1024 * 1024; // 브라우저에서 한 번 줄여 올리므로 넉넉하다 (next.config bodySizeLimit 과 맞춘다)

export type UploadResult = { url?: string; error?: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await assertAdmin();
  const file = formData.get('file');
  const folder = String(formData.get('folder'));
  if (!(file instanceof File) || file.size === 0) return { error: '이미지를 골라주세요' };
  if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) return { error: '알 수 없는 업로드 위치예요' };
  if (!file.type.startsWith('image/')) return { error: '이미지 파일만 올릴 수 있어요' };
  if (file.size > MAX_BYTES) return { error: '이미지가 너무 커요 (4MB 이하)' };

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // 휴대폰 사진의 회전 정보 반영
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: '이미지를 읽지 못했어요. 다른 파일로 시도해주세요.' };
  }

  const month = new Date().toISOString().slice(0, 7);
  const url = await putObject(`${folder}/${month}/${crypto.randomUUID()}.webp`, webp, 'image/webp');
  return { url };
}
