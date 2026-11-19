import { daysBetween, formatShort } from '@/lib/date';
import type { Artist } from '@/mocks/artists';
import type { Show } from '@/mocks/shows';

export type FeaturedArtist = Artist & { reason: string };

const WINDOW_DAYS = 30;

// 비로그인 For you 배너용: today 부터 30일 안에 공연이나 티켓 오픈이 있는 아티스트를
// 팔로워 많은 순으로 고른다. 이유 문구는 가장 가까운 일정 기준 ('12.5 공연', '티켓 오픈 D-1').
export function getFeaturedArtists({ shows, artists }: { shows: Show[]; artists: Artist[] }, today: string, limit = 6): FeaturedArtist[] {
  const nearest = new Map<string, { days: number; reason: string }>();

  const consider = (artistId: string, date: string, reason: (days: number) => string) => {
    const days = daysBetween(today, date);
    if (days < 0 || days > WINDOW_DAYS) return;
    const current = nearest.get(artistId);
    if (!current || days < current.days) nearest.set(artistId, { days, reason: reason(days) });
  };

  for (const show of shows) {
    for (const artistId of show.artistIds) {
      consider(artistId, show.startDate, () => `${formatShort(show.startDate).split('(')[0]} 공연`);
      if (show.ticketOpenAt) {
        consider(artistId, show.ticketOpenAt.slice(0, 10), (days) => (days === 0 ? '오늘 티켓 오픈' : `티켓 오픈 D-${days}`));
      }
    }
  }

  const byFollowers = [...artists].sort((a, b) => b.followerCount - a.followerCount);

  const scheduled = byFollowers
    .filter((artist) => nearest.has(artist.id))
    .slice(0, limit)
    .map((artist) => ({ ...artist, reason: nearest.get(artist.id)!.reason }));

  // 일정 있는 아티스트가 모자라면 에디터 추천으로 남은 칸을 채운다.
  const editorPicks = byFollowers
    .filter((artist) => artist.isEditorPick && !nearest.has(artist.id))
    .slice(0, limit - scheduled.length)
    .map((artist) => ({ ...artist, reason: '에디터 추천' }));

  return [...scheduled, ...editorPicks];
}
