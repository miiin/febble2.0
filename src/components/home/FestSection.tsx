import Image from 'next/image';
import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { formatRange } from '@/lib/date';
import { getToday } from '@/lib/today';
import { type Show, sortByDate } from '@/mocks/shows';

// 다가오는 페스티벌, 날짜 순.
export default async function FestSection({ shows }: { shows: Show[] }) {
  const today = await getToday();
  const festivals = sortByDate(shows.filter((show) => show.category === 'festival' && show.endDate >= today)).map((show) => ({
    id: show.id,
    title: show.title,
    image: show.image,
    date: formatRange(show.startDate, show.endDate),
    location: show.venue,
  }));

  return (
    <section className="mt-10 px-4 pb-14">
      <SectionTitle title="Fest" sub="다가오는 페스티벌" />
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {festivals.map((fest) => (
          <li key={fest.id} className="border-t-1 border-black">
            <Link href={`/shows/${fest.id}`}>
              <Thumb src={fest.image} alt={fest.title} className="aspect-square w-full" />
              <p className="mt-2 text-lg leading-tight font-medium tracking-[-0.04em]">{fest.title}</p>
              <p className="mt-1 text-[11px]">{fest.date}</p>
              <p className="text-[11px]">{fest.location}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/shows" className="mt-6 flex h-12 items-center justify-between rounded-lg bg-black px-4 text-white">
        <span className="text-sm font-medium">전체 공연 보기</span>
        <span className="flex items-center gap-1 text-[11px]">
          국내 인디 · 내한
          <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} className="invert" />
        </span>
      </Link>
    </section>
  );
}
