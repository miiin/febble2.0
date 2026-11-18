import Link from 'next/link';
import Thumb from '@/components/ui/Thumb';
import { formatShort } from '@/lib/date';
import type { Show } from '@/mocks/shows';

// 공연 목록 한 줄. 홈 New 섹션과 같은 모양.
export default function ShowRow({ show }: { show: Show }) {
  return (
    <li className="border-b border-black">
      <Link href={`/shows/${show.id}`} className="flex items-center gap-3 py-3 pl-2">
        <span className="w-16 shrink-0 text-xs">{formatShort(show.startDate)}</span>
        <Thumb src={show.image} alt={show.title} className="size-14" />
        <div className="min-w-0">
          <p className="truncate font-medium tracking-[-0.04em]">{show.title}</p>
          <p className="text-xs">{show.venue}</p>
        </div>
      </Link>
    </li>
  );
}
