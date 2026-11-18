import FestSection from '@/components/home/FestSection';
import ForYouBanner from '@/components/home/ForYouBanner';
import ForYouSection from '@/components/home/ForYouSection';
import NewSection from '@/components/home/NewSection';
import PickSection from '@/components/home/PickSection';
import TicketOpenTicker from '@/components/home/TicketOpenTicker';
import { isLoggedIn } from '@/mocks/session';

export default function Home() {
  return (
    <main>
      <PickSection />
      {isLoggedIn ? <ForYouSection /> : <ForYouBanner />}
      <NewSection />
      <TicketOpenTicker />
      <FestSection />
    </main>
  );
}
