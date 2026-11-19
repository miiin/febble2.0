import Link from 'next/link';
import { daysBetween } from '@/lib/date';
import { MOCK_TODAY, type Show } from '@/mocks/shows';

// 앞으로의 티켓 오픈을 가까운 순으로. 'D-2 실리카겔 연말공연 20:00'
// 같은 목록을 두 번 이어 붙이고 -50% 이동해 끊김 없이 흐르게 한다.
export default function TicketOpenTicker({ shows }: { shows: Show[] }) {
  const ticketOpens = shows
    .filter((show) => show.ticketOpenAt && show.ticketOpenAt.slice(0, 10) >= MOCK_TODAY)
    .sort((a, b) => a.ticketOpenAt!.localeCompare(b.ticketOpenAt!))
    .map((show) => {
      const days = daysBetween(MOCK_TODAY, show.ticketOpenAt!.slice(0, 10));
      return `${days === 0 ? '오늘' : `D-${days}`} ${show.title} ${show.ticketOpenAt!.slice(11)}`;
    });
  if (ticketOpens.length === 0) return null;

  const items = [...ticketOpens, ...ticketOpens];

  return (
    <Link href="/tickets" className="mt-8 flex h-12 items-center overflow-hidden border-y border-black bg-brand-yellow">
      <strong className="relative z-1 flex h-full shrink-0 items-center bg-brand-yellow pr-4 pl-3 text-xs">TICKET OPEN</strong>
      <div className="overflow-hidden">
        <ul className="flex w-max animate-marquee gap-6 text-xs">
          {items.map((text, index) => (
            <li key={index} className="flex items-center gap-6 whitespace-nowrap" aria-hidden={index >= ticketOpens.length}>
              {text}
              <span>✶</span>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
