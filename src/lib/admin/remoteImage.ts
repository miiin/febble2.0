// 다른 사이트의 이미지 주소를 우리 R2 로 복사한다. 서버에서만 쓴다.
// next/image 는 R2·Spotify 주소만 허용해서, 외부 주소를 그대로 저장하면 사이트 화면이 깨진다.
import 'server-only';
import sharp from 'sharp';
import { putObject } from '@/lib/storage';

const MAX_BYTES = 15 * 1024 * 1024;

// KOPIS 사이트의 썸네일 주소(/_next/image?url=/upload/…&w=256)는 원본 주소로 바꾼다. http 는 https 로.
function originalUrl(url: string) {
  const parsed = new URL(url);
  if (/^(www\.)?kopis\.or\.kr$/.test(parsed.hostname)) {
    const inner = parsed.pathname === '/_next/image' ? parsed.searchParams.get('url') : null;
    return inner?.startsWith('/') ? `https://kopis.or.kr${inner}` : url.replace(/^http:\/\/(www\.)?kopis\.or\.kr/, 'https://kopis.or.kr');
  }
  return url;
}

/** 긴 변 1600px webp 로 줄여 올린 주소. 이미지가 아니거나 받지 못하면 undefined */
export async function copyRemoteImage(url: string) {
  try {
    const response = await fetch(originalUrl(url), { signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return undefined;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_BYTES) return undefined;
    const webp = await sharp(bytes)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return await putObject(`shows/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`, webp, 'image/webp');
  } catch {
    return undefined;
  }
}
