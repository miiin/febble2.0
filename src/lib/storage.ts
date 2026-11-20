// 이미지 저장소: Cloudflare R2 (S3 호환). 서버에서만 쓴다.
// 공개 주소는 R2_PUBLIC_URL (r2.dev 공개 주소나 연결한 도메인) + '/' + key.
import 'server-only';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} 환경 변수가 없어요 (.env.local)`);
  return value;
};

let client: S3Client | undefined;
function r2() {
  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
  });
  return client;
}

const publicBase = () => env('R2_PUBLIC_URL').replace(/\/$/, '');

export function publicUrl(key: string) {
  return `${publicBase()}/${key}`;
}

/** 우리 버킷의 공개 주소면 key 를, 아니면 undefined */
export function keyFromUrl(url: string) {
  const base = `${publicBase()}/`;
  return url.startsWith(base) ? url.slice(base.length) : undefined;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await r2().send(
    new PutObjectCommand({
      Bucket: env('R2_BUCKET'),
      Key: key,
      Body: body,
      ContentType: contentType,
      // key 에 무작위 id 가 들어가 내용이 바뀌지 않으므로 오래 캐시해도 된다.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return publicUrl(key);
}

export async function getObjectBytes(key: string) {
  const result = await r2().send(new GetObjectCommand({ Bucket: env('R2_BUCKET'), Key: key }));
  return Buffer.from(await result.Body!.transformToByteArray());
}
