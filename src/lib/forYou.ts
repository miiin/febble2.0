// 홈 For you(로그인): 팔로우한 아티스트 소식 + "○○ 좋아한다면" 추천. 카탈로그와 팔로우 목록으로 계산한다.
// 추천 근거(같이 팔로우, 장르)는 화면 문구로 드러내지 않는다.
import type { CoFollows } from '@/lib/coFollows';
import { daysBetween, formatRange } from '@/lib/date';
import type { Artist } from '@/mocks/artists';
import type { Badge } from '@/mocks/home';
import type { Show } from '@/mocks/shows';

const NEWS_LIMIT = 3;
const RECOMMEND_LIMIT = 2;
const OPEN_SOON_DAYS = 7;
const NEW_DAYS = 7;
// 장르는 넓은 신호라 같이 팔로우보다 약하게 친다. 팬층이 많이 겹치면 장르가 같은 아티스트보다 앞선다.
const GENRE_WEIGHT = 0.5;

export type ForYouNews = {
  showId: string;
  name: string;
  image?: string;
  date: string;
  /** 단독 공연은 공연장, 페스티벌은 페스티벌 이름 */
  place: string;
  badge?: { type: Badge; label: string };
};

export type ForYouRecommendation = {
  basedOn: string;
  shows: { id: string; title: string; image?: string; date: string; venue: string }[];
};

/** 두 아티스트 팬층이 겹치는 정도 (코사인). 인기 아티스트가 늘 1등이 되지 않게 각자의 팔로워 수로 나눈다. */
function coFollowScore(a: Artist, b: Artist, { both, followers }: CoFollows) {
  const n = both[a.id]?.[b.id] ?? 0;
  return n > 0 ? n / Math.sqrt((followers[a.id] ?? n) * (followers[b.id] ?? n)) : 0;
}

/** 장르가 겹치는 정도 (자카드) */
function genreScore(a: Artist, b: Artist) {
  const shared = a.genres.filter((genre) => b.genres.includes(genre)).length;
  return shared > 0 ? shared / new Set([...a.genres, ...b.genres]).size : 0;
}

export function getForYou(
  { shows, artists }: { shows: Show[]; artists: Artist[] },
  followedIds: string[],
  today: string,
  coFollows: CoFollows = { both: {}, followers: {} },
) {
  const followed = new Set(followedIds);
  const artistById = new Map(artists.map((artist) => [artist.id, artist]));
  const upcoming = [...shows].filter((show) => show.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 팔로우한 아티스트가 나오는 공연, 날짜 순. 한 공연에 여러 명이면 이름을 이어 붙인다.
  const news: ForYouNews[] = upcoming
    .map((show) => ({ show, mine: show.artistIds.filter((id) => followed.has(id)).map((id) => artistById.get(id)!) }))
    .filter(({ mine }) => mine.length > 0)
    .slice(0, NEWS_LIMIT)
    .map(({ show, mine }) => {
      const openDays = show.ticketOpenAt ? daysBetween(today, show.ticketOpenAt.slice(0, 10)) : -1;
      const isNew = show.createdAt !== undefined && daysBetween(show.createdAt, today) <= NEW_DAYS;
      return {
        showId: show.id,
        name: mine.map((artist) => artist.name).join(' · '),
        image: mine[0].image,
        date: formatRange(show.startDate, show.endDate),
        place: show.category === 'festival' ? show.title : show.venue,
        badge:
          openDays >= 0 && openDays <= OPEN_SOON_DAYS
            ? { type: 'open-soon' as const, label: openDays === 0 ? '오늘 오픈' : `오픈 D-${openDays}` }
            : isNew
              ? { type: 'new' as const, label: '새공연' }
              : undefined,
      };
    });

  // 최근에 팔로우한 아티스트부터, 아직 팔로우하지 않은 비슷한 아티스트의 공연을 찾는다.
  // 비슷한 정도 = 같이 팔로우 점수(0~1) + 장르 점수(0~1) × GENRE_WEIGHT. 점수가 높은 아티스트의 공연부터, 같으면 날짜 순.
  const shown = new Set(news.map((item) => item.showId));
  let recommendation: ForYouRecommendation | undefined;
  for (const id of [...followedIds].reverse()) {
    const base = artistById.get(id);
    if (!base) continue;
    const similarity = new Map<string, number>();
    for (const artist of artists) {
      if (followed.has(artist.id)) continue;
      const score = coFollowScore(base, artist, coFollows) + genreScore(base, artist) * GENRE_WEIGHT;
      if (score > 0) similarity.set(artist.id, score);
    }
    const showScore = (show: Show) => Math.max(0, ...show.artistIds.map((artistId) => similarity.get(artistId) ?? 0));
    const picks = upcoming
      .filter((show) => !shown.has(show.id) && showScore(show) > 0)
      .sort((a, b) => showScore(b) - showScore(a)) // 안정 정렬이라 점수가 같으면 날짜 순이 유지된다
      .slice(0, RECOMMEND_LIMIT);
    if (picks.length > 0) {
      recommendation = {
        basedOn: base.name,
        shows: picks.map((show) => ({
          id: show.id,
          title: show.title,
          image: show.image,
          date: formatRange(show.startDate, show.endDate),
          venue: show.venue,
        })),
      };
      break;
    }
  }

  return { news, recommendation };
}
