// 홈 For you(로그인): 팔로우한 아티스트 소식 + "○○ 좋아한다면" 추천. 카탈로그와 팔로우 목록으로 계산한다.
import { daysBetween, formatRange } from '@/lib/date';
import type { Artist } from '@/mocks/artists';
import type { Badge } from '@/mocks/home';
import type { Show } from '@/mocks/shows';

const NEWS_LIMIT = 3;
const RECOMMEND_LIMIT = 2;
const OPEN_SOON_DAYS = 7;
const NEW_DAYS = 7;

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

export function getForYou({ shows, artists }: { shows: Show[]; artists: Artist[] }, followedIds: string[], today: string) {
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

  // 최근에 팔로우한 아티스트부터, 장르가 겹치고 아직 팔로우하지 않은 아티스트의 공연을 찾는다.
  const shown = new Set(news.map((item) => item.showId));
  let recommendation: ForYouRecommendation | undefined;
  for (const id of [...followedIds].reverse()) {
    const base = artistById.get(id);
    if (!base) continue;
    const similar = new Set(
      artists.filter((artist) => !followed.has(artist.id) && artist.genres.some((genre) => base.genres.includes(genre))).map((artist) => artist.id),
    );
    const picks = upcoming.filter((show) => !shown.has(show.id) && show.artistIds.some((artistId) => similar.has(artistId))).slice(0, RECOMMEND_LIMIT);
    if (picks.length > 0) {
      recommendation = {
        basedOn: base.name,
        shows: picks.map((show) => ({ id: show.id, title: show.title, image: show.image, date: formatRange(show.startDate, show.endDate), venue: show.venue })),
      };
      break;
    }
  }

  return { news, recommendation };
}
