import Link from 'next/link';
import LikeButton from '@/components/ui/LikeButton';
import Thumb from '@/components/ui/Thumb';
import { formatRange } from '@/lib/date';
import type { PickIssue, PickItem } from '@/mocks/picks';
import { MOCK_TODAY, type Show } from '@/mocks/shows';

type Props = {
  issue: PickIssue;
  /** 제목 아래 설명 앞부분. 홈은 '이번 호에 고른 공연', Vol 상세는 '12호에 고른 공연' */
  label: string;
  /** 호에 실린 공연을 찾을 카탈로그 */
  shows: Show[];
};

function resolve(item: PickItem, shows: Show[]) {
  const show = shows.find((candidate) => candidate.id === item.showId);
  if (!show) return undefined;
  return {
    ...show,
    description: item.description,
    date: formatRange(show.startDate, show.endDate),
    isToday: show.startDate <= MOCK_TODAY && MOCK_TODAY <= show.endDate,
  };
}

// Febble Pick 한 호. 홈 Pick 섹션과 Vol 상세가 같이 쓴다.
export default function PickIssueView({ issue, label, shows }: Props) {
  const main = resolve(issue.main, shows);
  const others = issue.others.map((item) => resolve(item, shows)).filter((show) => show !== undefined);
  if (!main) return null;

  return (
    <>
      <div className="px-4">
        <h2 className="flex items-baseline">
          <span className="font-display text-[29px] font-medium tracking-[-0.02em]">Febble</span>
          <span className="font-serif text-[32px]">Pick</span>
        </h2>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm tracking-[-0.04em]">
            {label} {others.length + 1}개
          </p>
          <span className="font-plex text-xs italic">Vol.{issue.vol}</span>
        </div>

        <Link href={`/shows/${main.id}`} className="block">
          <Thumb src={main.image} alt={main.title} className="mt-3 aspect-square w-full" />
          <h3 className="mt-4 font-display text-[28px] tracking-[-0.02em]">{main.title}</h3>
        </Link>
        <p className="mt-2 text-sm leading-relaxed tracking-[-0.04em] whitespace-pre-line">{main.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span>
            {main.date} · {main.venue}
          </span>
          <span className="text-[11px]">curated by {issue.curator}</span>
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href={main.ticketVendors[0]?.url ?? '#'}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm"
          >
            예매하러 가기
          </Link>
          <LikeButton className="flex size-11 items-center justify-center rounded-full border border-black" />
        </div>
      </div>

      <ol className="mt-8 border-t border-black">
        {others.map((show, index) => (
          <li key={show.id} className="flex gap-3 border-b border-black px-4 py-5">
            <span className="w-7 shrink-0 font-display text-lg leading-tight">{String(index + 2).padStart(2, '0')}</span>
            <Link href={`/shows/${show.id}`} className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1.5 text-lg leading-tight font-medium tracking-[-0.04em]">
                {show.title}
                {show.isToday && <span className="rounded-[50%] border border-black px-2 py-0.5 font-plex text-[9px] font-normal italic">TODAY</span>}
              </h3>
              <p className="mt-2 text-[13px] leading-snug tracking-[-0.04em]">{show.description}</p>
              <p className="mt-2 text-xs">
                {show.date} · {show.venue}
              </p>
            </Link>
            <div className="relative">
              <Thumb src={show.image} alt={show.title} className="size-18" />
              <LikeButton className="absolute top-0.5 right-0.5" />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
