// Spotify Web API (앱 인증, client credentials). 서버에서만 쓴다. 로그인 없이 검색·조회만 한다.
import 'server-only';

export type SpotifyArtist = {
  id: string;
  name: string;
  followers: number;
  genres: string[];
  /** 미리보기용 작은 사진 (Spotify 주소 그대로. 우리 저장소에 복사하지 않는다) */
  image?: string;
  /** 사이트 대표 사진용 가장 큰 사진 (보통 640px) */
  imageLarge?: string;
  url: string;
};

type RawArtist = {
  id: string;
  name: string;
  followers?: { total: number };
  genres?: string[];
  images?: { url: string; width: number }[];
  external_urls: { spotify: string };
};

let token: { value: string; expiresAt: number } | undefined;

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET 환경 변수가 없어요');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Spotify 토큰을 받지 못했어요 (${response.status})`);
  const data = (await response.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return token.value;
}

async function api<T>(path: string) {
  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    cache: 'no-store',
  });
  if (response.status === 404 || response.status === 400) return undefined;
  if (!response.ok) throw new Error(`Spotify 요청이 실패했어요 (${response.status})`);
  return (await response.json()) as T;
}

const toArtist = (raw: RawArtist): SpotifyArtist => ({
  id: raw.id,
  name: raw.name,
  followers: raw.followers?.total ?? 0,
  genres: raw.genres ?? [],
  // 사진은 큰 것부터 오므로 목록용으로 가장 작은 쪽(160px 안팎)을 고른다.
  image: [...(raw.images ?? [])].sort((a, b) => a.width - b.width).find((img) => img.width >= 120)?.url ?? raw.images?.at(-1)?.url,
  imageLarge: [...(raw.images ?? [])].sort((a, b) => b.width - a.width)[0]?.url,
  url: raw.external_urls.spotify,
});

export async function searchArtists(query: string, limit = 8) {
  const params = new URLSearchParams({ q: query, type: 'artist', limit: String(limit), market: 'KR' });
  const data = await api<{ artists: { items: RawArtist[] } }>(`search?${params}`);
  return (data?.artists.items ?? []).map(toArtist);
}

export async function getArtist(id: string) {
  const raw = await api<RawArtist>(`artists/${encodeURIComponent(id)}`);
  return raw && toArtist(raw);
}
