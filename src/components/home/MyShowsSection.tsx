import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { daysBetween, formatShort } from '@/lib/date';
import type { Show } from '@/mocks/shows';

type Props = { shows: Show[]; today: string };

/** 'D-3', 당일 'D-DAY', 여러 날 공연이 이미 시작했으면 '진행 중' */
function dDay(show: Show, today: string) {
  const days = daysBetween(today, show.startDate);
  return days > 0 ? `D-${days}` : days === 0 ? 'D-DAY' : '진행 중';
}

// 로그인 사용자의 찜한 공연 중 가장 가까운 공연. 홈 맨 위에 두고, 다가오는 공연이 없으면 그리지 않는다 (page 에서 거른다).
export default function MyShowsSection({ shows, today }: Props) {
  return (
    <section className="mt-6 px-4">
      <div className="flex items-baseline justify-between">
        <SectionTitle title="My shows" sub="다가오는 찜한 공연" />
        <Link href="/me#liked" className="text-xs underline underline-offset-2">
          전체 보기
        </Link>
      </div>
      <ul className="mt-3 border-t-2 border-black">
        {shows.map((show) => (
          <li key={show.id} className="border-b border-black">
            <Link href={`/shows/${show.id}`} className="flex items-center gap-3 py-3 pl-2">
              <span className="w-16 shrink-0 text-xs">{formatShort(show.startDate)}</span>
              <Thumb src={show.image} alt={show.title} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{show.title}</p>
                <p className="truncate text-xs">{show.venue}</p>
              </div>
              <span className="inline-flex h-5 shrink-0 items-center rounded-[50%] bg-black px-2.5 text-[11px] leading-none tracking-[-0.02em] text-white">
                {dDay(show, today)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
