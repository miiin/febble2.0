import { Suspense } from 'react';
import FestSection from '@/components/home/FestSection';
import ForYouBanner from '@/components/home/ForYouBanner';
import ForYouSection from '@/components/home/ForYouSection';
import MyShowsSection from '@/components/home/MyShowsSection';
import NewSection from '@/components/home/NewSection';
import PickSection from '@/components/home/PickSection';
import TicketOpenTicker from '@/components/home/TicketOpenTicker';
import { getCatalog } from '@/lib/catalog';
import { getCoFollows } from '@/lib/coFollows';
import { getFeaturedArtists } from '@/lib/featuredArtists';
import { getForYou } from '@/lib/forYou';
import { getToday } from '@/lib/today';
import { getCurrentUser, getFollowedArtistIds, getLikedShowIds } from '@/lib/user';
import { sortByDate } from '@/mocks/shows';

export default async function Home() {
  const [catalog, today] = await Promise.all([getCatalog(), getToday()]);

  return (
    <main>
      <Suspense>
        <MyShows catalog={catalog} today={today} />
      </Suspense>
      <PickSection />
      {/* 로그인 여부(세션)는 요청 때 읽는다. 나머지 섹션은 미리 만들어둔다. */}
      <Suspense>
        <ForYou catalog={catalog} today={today} banner={<ForYouBanner featured={getFeaturedArtists(catalog, today)} />} />
      </Suspense>
      <NewSection catalog={catalog} />
      <TicketOpenTicker shows={catalog.shows} />
      <FestSection shows={catalog.shows} />
    </main>
  );
}

const MY_SHOWS_LIMIT = 3;

/** 찜한 공연 중 끝나지 않은 가장 가까운 공연. 비로그인이거나 없으면 그리지 않는다. */
async function MyShows({ catalog, today }: { catalog: Awaited<ReturnType<typeof getCatalog>>; today: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const liked = new Set(await getLikedShowIds(user.id));
  const shows = sortByDate(catalog.shows.filter((show) => liked.has(show.id) && show.endDate >= today)).slice(0, MY_SHOWS_LIMIT);
  if (shows.length === 0) return null;
  return <MyShowsSection shows={shows} today={today} />;
}

async function ForYou({ catalog, today, banner }: { catalog: Awaited<ReturnType<typeof getCatalog>>; today: string; banner: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return banner;

  const [followedIds, coFollows] = await Promise.all([getFollowedArtistIds(user.id), getCoFollows()]);
  const { news, recommendation } = getForYou(catalog, followedIds, today, coFollows);
  return <ForYouSection news={news} recommendation={recommendation} hasFollowing={followedIds.length > 0} />;
}
