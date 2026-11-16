import FestSection from '@/components/home/FestSection';
import ForYouSection from '@/components/home/ForYouSection';
import NewSection from '@/components/home/NewSection';
import PickSection from '@/components/home/PickSection';
import TicketOpenTicker from '@/components/home/TicketOpenTicker';

export default function Home() {
  return (
    <main>
      <PickSection />
      <ForYouSection />
      <NewSection />
      <TicketOpenTicker />
      <FestSection />
    </main>
  );
}
