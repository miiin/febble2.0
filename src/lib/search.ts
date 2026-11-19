import { getCatalog } from '@/lib/catalog';
import { sortByDate } from '@/mocks/shows';

// 공백·대소문자 무시하고 포함 여부로 찾는다. 카탈로그가 작아서 캐시된 목록 안에서 찾는다.
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

export async function search(query: string) {
  const q = normalize(query);
  if (!q) return { artists: [], shows: [] };
  const { artists, shows } = await getCatalog();

  return {
    artists: artists.filter((artist) => [artist.name, ...artist.genres].some((text) => normalize(text).includes(q))),
    shows: sortByDate(shows.filter((show) => [show.title, show.venue].some((text) => normalize(text).includes(q)))),
  };
}

/** 검색어가 없을 때 보여줄 추천 검색어: 팔로워 많은 아티스트 */
export async function suggestedQueries(limit = 6) {
  return [...(await getCatalog()).artists]
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit)
    .map((artist) => artist.name);
}
