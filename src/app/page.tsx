import { Suspense } from 'react';
import FestSection from '@/components/home/FestSection';
import ForYouBanner from '@/components/home/ForYouBanner';
import ForYouSection from '@/components/home/ForYouSection';
import NewSection from '@/components/home/NewSection';
import PickSection from '@/components/home/PickSection';
import TicketOpenTicker from '@/components/home/TicketOpenTicker';
import { getCatalog } from '@/lib/catalog';
import { getFeaturedArtists } from '@/lib/featuredArtists';
import { getCurrentUser } from '@/lib/user';
import { MOCK_TODAY } from '@/mocks/shows';

export default async function Home() {
  const catalog = await getCatalog();

  return (
    <main>
      <PickSection />
      {/* 로그인 여부(세션)는 요청 때 읽는다. 나머지 섹션은 미리 만들어둔다. */}
      <Suspense>
        <ForYou banner={<ForYouBanner featured={getFeaturedArtists(catalog, MOCK_TODAY)} />} />
      </Suspense>
      <NewSection catalog={catalog} />
      <TicketOpenTicker shows={catalog.shows} />
      <FestSection shows={catalog.shows} />
    </main>
  );
}

async function ForYou({ banner }: { banner: React.ReactNode }) {
  return (await getCurrentUser()) ? <ForYouSection /> : banner;
}
