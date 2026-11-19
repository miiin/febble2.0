import FestSection from '@/components/home/FestSection';
import ForYouBanner from '@/components/home/ForYouBanner';
import ForYouSection from '@/components/home/ForYouSection';
import NewSection from '@/components/home/NewSection';
import PickSection from '@/components/home/PickSection';
import TicketOpenTicker from '@/components/home/TicketOpenTicker';
import { getCatalog } from '@/lib/catalog';
import { getFeaturedArtists } from '@/lib/featuredArtists';
import { isLoggedIn } from '@/mocks/session';
import { MOCK_TODAY } from '@/mocks/shows';

export default async function Home() {
  const catalog = await getCatalog();

  return (
    <main>
      <PickSection />
      {isLoggedIn ? <ForYouSection /> : <ForYouBanner featured={getFeaturedArtists(catalog, MOCK_TODAY)} />}
      <NewSection catalog={catalog} />
      <TicketOpenTicker shows={catalog.shows} />
      <FestSection shows={catalog.shows} />
    </main>
  );
}
