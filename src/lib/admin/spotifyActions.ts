'use server';

import { assertAdmin } from '@/lib/admin/guard';
import { getArtist, searchArtists, type SpotifyArtist } from '@/lib/spotify';

export type SpotifySearchResult = { artists?: SpotifyArtist[]; error?: string };

export async function searchSpotifyArtists(query: string): Promise<SpotifySearchResult> {
  await assertAdmin();
  const q = query.trim().slice(0, 100);
  if (!q) return { artists: [] };
  try {
    return { artists: await searchArtists(q) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Spotify 검색이 실패했어요' };
  }
}

/** id 또는 open.spotify.com/artist/… 링크 */
export async function lookupSpotifyArtist(idOrUrl: string): Promise<{ artist?: SpotifyArtist; error?: string }> {
  await assertAdmin();
  const id = idOrUrl.trim().match(/artist\/([A-Za-z0-9]{22})/)?.[1] ?? idOrUrl.trim();
  if (!/^[A-Za-z0-9]{22}$/.test(id)) return { error: 'Spotify 아티스트 링크나 ID(22자)가 아니에요' };
  try {
    const artist = await getArtist(id);
    return artist ? { artist } : { error: 'Spotify 에서 찾을 수 없는 아티스트예요' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Spotify 조회가 실패했어요' };
  }
}
