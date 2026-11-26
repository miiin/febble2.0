import { Suspense } from 'react';
import LoginRequired from '@/components/auth/LoginRequired';
import FollowingTabs, { type NewsItem } from '@/components/me/FollowingTabs';
import SectionTitle from '@/components/ui/SectionTitle';
import { daysBetween, formatRange } from '@/lib/date';
import { getArtist, getShowsByArtist } from '@/lib/catalog';
import { getToday } from '@/lib/today';
import { getCurrentUser, getFollowedArtistIds } from '@/lib/user';

const OPEN_SOON_DAYS = 7;

export default function FollowingPage() {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Following" sub="팔로우한 아티스트 소식" />
      <Suspense>
        <Following />
      </Suspense>
    </main>
  );
}

async function Following() {
  const user = await getCurrentUser();
  if (!user) return <LoginRequired message={'아티스트를 팔로우하고\n공연 소식을 받아보세요'} />;

  const followedArtistIds = await getFollowedArtistIds(user.id);
  const artists = (await Promise.all(followedArtistIds.map(getArtist))).filter((artist) => artist !== undefined);

  // 팔로우한 아티스트의 앞으로 있을 공연을 날짜 순으로.
  const [showsByArtist, today] = await Promise.all([Promise.all(artists.map((artist) => getShowsByArtist(artist.id))), getToday()]);
  const news: NewsItem[] = artists
    .flatMap((artist, index) =>
      showsByArtist[index]
        .filter((show) => show.endDate >= today)
        .map((show) => {
          const openDays = show.ticketOpenAt ? daysBetween(today, show.ticketOpenAt.slice(0, 10)) : -1;
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
