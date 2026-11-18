import LoginRequired from '@/components/auth/LoginRequired';
import FollowingTabs, { type NewsItem } from '@/components/me/FollowingTabs';
import SectionTitle from '@/components/ui/SectionTitle';
import { daysBetween, formatRange } from '@/lib/date';
import { getArtist } from '@/mocks/artists';
import { followedArtistIds, isLoggedIn } from '@/mocks/session';
import { getShowsByArtist, MOCK_TODAY } from '@/mocks/shows';

const OPEN_SOON_DAYS = 7;

export default function FollowingPage() {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Following" sub="팔로우한 아티스트 소식" />
      {isLoggedIn ? <Following /> : <LoginRequired message={'아티스트를 팔로우하고\n공연 소식을 받아보세요'} />}
    </main>
  );
}

function Following() {
  const artists = followedArtistIds.map(getArtist).filter((artist) => artist !== undefined);

  // 팔로우한 아티스트의 앞으로 있을 공연을 날짜 순으로.
  const news: NewsItem[] = artists
    .flatMap((artist) =>
      getShowsByArtist(artist.id)
        .filter((show) => show.endDate >= MOCK_TODAY)
        .map((show) => {
          const openDays = show.ticketOpenAt ? daysBetween(MOCK_TODAY, show.ticketOpenAt.slice(0, 10)) : -1;
          return {
            showId: show.id,
            startDate: show.startDate,
            artist,
            title: show.title,
            date: formatRange(show.startDate, show.endDate),
            venue: show.venue,
            openLabel: openDays >= 0 && openDays <= OPEN_SOON_DAYS ? `D-${openDays}` : undefined,
          };
        }),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return <FollowingTabs news={news} artists={artists} />;
}
