import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { daysBetween, formatShort } from '@/lib/date';
import { getShows } from '@/lib/catalog';
import { MOCK_TODAY } from '@/mocks/shows';

// 앞으로 열리는 예매 일정. 날짜별로 묶고 같은 날은 시간 순.
export default async function TicketsPage() {
  const upcoming = (await getShows())
    .filter((show) => show.ticketOpenAt && show.ticketOpenAt.slice(0, 10) >= MOCK_TODAY)
    .sort((a, b) => a.ticketOpenAt!.localeCompare(b.ticketOpenAt!));

  const groups = new Map<string, typeof upcoming>();
  for (const show of upcoming) {
    const day = show.ticketOpenAt!.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), show]);
  }

  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Ticket open" sub="예매 오픈 일정" />

      {groups.size === 0 && <p className="mt-10 text-center text-sm">예정된 티켓 오픈이 없어요.</p>}

      {[...groups].map(([day, list]) => {
        const days = daysBetween(MOCK_TODAY, day);
        return (
          <section key={day} className="mt-8">
            <h2 className="flex items-center gap-2">
              <span className="font-display text-lg">{formatShort(day)}</span>
              <span className="rounded-[50%] border border-black bg-brand-yellow px-2.5 py-0.5 text-[11px]">
                {days === 0 ? '오늘' : `D-${days}`}
              </span>
            </h2>
            <ul className="mt-2 border-t-2 border-black">
              {list.map((show) => (
                <li key={show.id} className="border-b border-black">
                  <Link href={`/shows/${show.id}`} className="flex items-center gap-3 py-3 pl-2">
                    <span className="w-12 shrink-0 font-display text-sm">{show.ticketOpenAt!.slice(11)}</span>
                    <Thumb src={show.image} alt={show.title} className="size-14" />
                    <div className="min-w-0">
                      <p className="truncate font-medium tracking-[-0.04em]">{show.title}</p>
                      <p className="text-xs">
                        {formatShort(show.startDate)} 공연 · {show.venue}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
