import type { NextConfig } from 'next';

// R2 에 올린 이미지와 Spotify 프로필 사진을 next/image 로 줄여 보여준다.
const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // R2(업로드한 사진) + Spotify 프로필 사진(업로드한 사진이 없는 아티스트)
    remotePatterns: [...(r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : []), new URL('https://i.scdn.co/image/**')],
  },
  experimental: {
    // 어드민 이미지 업로드 (브라우저에서 긴 변 2000px 로 줄여 보낸다). Vercel 요청 한도 4.5MB 보다 작게.
    serverActions: { bodySizeLimit: '4mb' },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
