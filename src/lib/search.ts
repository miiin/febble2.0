import { getCatalog } from '@/lib/catalog';
import { sortByDate } from '@/mocks/shows';

// 공백·대소문자 무시하고 포함 여부로 찾는다. 카탈로그가 작아서 캐시된 목록 안에서 찾는다.
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

// 장르는 Spotify 표기(영문 소문자: k-rock, city pop)로 저장한다. 한글로 검색해도 찾도록 검색어의 한글 장르 이름을 영문으로 바꿔 본다.
// 긴 말부터 바꾼다 ('포스트록' 이 '록' 보다 먼저). 여러 뜻이 있는 말은 모두 찾는다 (펑크 → punk, funk).
const GENRE_KO: [string, string[]][] = [
  ['사이키델릭', ['psychedelic']],
  ['얼터너티브', ['alternative', 'alt']],
  ['익스페리멘탈', ['experimental']],
  ['일렉트로닉', ['electronic']],
  ['포스트록', ['post-rock']],
  ['슈게이즈', ['shoegaze']],
  ['하드코어', ['hardcore']],
  ['싱어송라이터', ['singer-songwriter']],
  ['드림팝', ['dreampop']],
  ['시부야케이', ['shibuya-kei']],
  ['시티팝', ['citypop']],
  ['앰비언트', ['ambient']],
  ['어쿠스틱', ['acoustic']],
  ['인디', ['indie']],
  ['힙합', ['hiphop']],
  ['알앤비', ['r&b']],
  ['케이팝', ['k-pop']],
  ['발라드', ['ballad']],
  ['컨트리', ['country']],
  ['그런지', ['grunge']],
  ['메탈', ['metal']],
  ['재즈', ['jazz']],
  ['포크', ['folk']],
  ['소울', ['soul']],
  ['블루스', ['blues']],
  ['디스코', ['disco']],
  ['하우스', ['house']],
  ['테크노', ['techno']],
  ['펑크', ['punk', 'funk']],
  ['훵크', ['funk']],
  ['한국', ['k-']],
  ['일본', ['j-']],
  ['록', ['rock']],
  ['락', ['rock']],
  ['팝', ['pop']],
  ['랩', ['rap']],
];

/** 장르 비교에 쓸 검색어들: 원래 검색어 + 한글 장르 이름을 영문으로 바꾼 것 */
function genreQueries(q: string) {
  let variants = [q];
  for (const [ko, ens] of GENRE_KO) {
    if (!variants.some((variant) => variant.includes(ko))) continue;
    variants = variants.flatMap((variant) => (variant.includes(ko) ? ens.map((en) => variant.replaceAll(ko, en)) : [variant]));
  }
  return [...new Set([q, ...variants])];
}

export async function search(query: string) {
  const q = normalize(query);
  if (!q) return { artists: [], shows: [] };
  const { artists, shows } = await getCatalog();
  const genreQs = genreQueries(q);

  return {
    artists: artists.filter(
      (artist) =>
        [artist.name, ...(artist.aliases ?? [])].some((name) => normalize(name).includes(q)) ||
        artist.genres.some((genre) => genreQs.some((gq) => normalize(genre).includes(gq))),
    ),
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
