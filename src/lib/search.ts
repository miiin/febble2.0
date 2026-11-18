import { artists } from '@/mocks/artists';
import { shows, sortByDate } from '@/mocks/shows';

// 공백·대소문자 무시하고 포함 여부로 찾는다. 서버 연동 전 mock 검색.
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

export function search(query: string) {
  const q = normalize(query);
  if (!q) return { artists: [], shows: [] };

  return {
    artists: artists.filter((artist) => [artist.name, ...artist.genres].some((text) => normalize(text).includes(q))),
    shows: sortByDate(shows.filter((show) => [show.title, show.venue].some((text) => normalize(text).includes(q)))),
  };
}

/** 검색어가 없을 때 보여줄 추천 검색어: 팔로워 많은 아티스트 */
export function suggestedQueries(limit = 6) {
  return [...artists]
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit)
    .map((artist) => artist.name);
}
