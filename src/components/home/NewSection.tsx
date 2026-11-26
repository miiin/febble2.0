import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import type { getCatalog } from '@/lib/catalog';
import { daysBetween, formatShort } from '@/lib/date';
import { getToday } from '@/lib/today';
import type { Badge as BadgeType } from '@/mocks/home';

const LIMIT = 5;
const OPEN_SOON_DAYS = 7;

type Props = { catalog: Awaited<ReturnType<typeof getCatalog>> };

// 최근 등록된 앞으로의 공연. 배지는 이번 호 Pick > 티켓 오픈 임박 순.
export default async function NewSection({ catalog }: Props) {
  const today = await getToday();
  const latestPick = catalog.pickIssues[0];
  const picked = new Set(latestPick ? [latestPick.main, ...latestPick.others].map((item) => item.showId) : []);

  const newShows = catalog.shows
    .filter((show) => show.endDate >= today)
    .slice(0, LIMIT)
    .map((show) => {
      const openDays = show.ticketOpenAt ? daysBetween(today, show.ticketOpenAt.slice(0, 10)) : -1;
      const badge: { type: BadgeType; label: string } | undefined = picked.has(show.id)
        ? { type: 'pick', label: 'PICK' }
        : openDays >= 0 && openDays <= OPEN_SOON_DAYS
          ? { type: 'open-soon', label: openDays === 0 ? '오늘 오픈' : `오픈 D-${openDays}` }
          : undefined;
      return { ...show, date: formatShort(show.startDate), badge };
    });

  return (
    <section className="mt-10 px-4">
      <SectionTitle title="New" sub="새로 올라온 공연" />
      <ul className="mt-3 border-t-2 border-black">
        {newShows.map((show) => (
          <li key={show.id} className="relative border-b border-black">
            <Link href={`/shows/${show.id}`} className="flex items-center gap-3 py-3 pl-2">
              <span className="w-16 shrink-0 text-xs">{show.date}</span>
              <Thumb src={show.image} alt={show.title} className="size-14" />
              <div className="min-w-0 pr-14">
                <p className="truncate font-medium">{show.title}</p>
                <p className="text-xs">{show.venue}</p>
              </div>
            </Link>
            {show.badge && (
              <div className="absolute top-3 right-0">
                <Badge type={show.badge.type}>{show.badge.label}</Badge>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
