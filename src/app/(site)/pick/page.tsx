import Link from 'next/link';
import Thumb from '@/components/ui/Thumb';
import { formatShort } from '@/lib/date';
import { getCatalog } from '@/lib/catalog';
import { formatVol } from '@/mocks/picks';

export default async function PickListPage() {
  const { pickIssues, shows } = await getCatalog();

  return (
    <main className="pt-8 pb-14">
      <div className="px-4">
        <h1 className="flex items-baseline">
          <span className="font-display text-[29px] font-medium tracking-[-0.02em]">Febble</span>
          <span className="font-serif text-[32px]">Pick</span>
        </h1>
        <p className="mt-1 text-sm tracking-[-0.04em]">에디터가 고른 공연, 지난 호까지 모아보기</p>
      </div>

      <ol className="mt-6 border-t-2 border-black">
        {pickIssues.map((issue, index) => {
          const main = shows.find((show) => show.id === issue.main.showId);
          return (
            <li key={issue.vol} className="border-b border-black">
              <Link href={`/pick/${issue.vol}`} className="flex items-center gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-plex text-xs italic">
                    {formatVol(issue.vol)}
                    {index === 0 && <span className="rounded-[50%] border border-black px-2 py-0.5 text-[9px]">LATEST</span>}
                  </p>
                  <p className="mt-1.5 truncate text-lg leading-tight font-medium tracking-[-0.04em]">{main?.title}</p>
                  <p className="mt-1.5 text-xs">
                    {formatShort(issue.publishedAt)} · 공연 {issue.others.length + 1}개 · curated by {issue.curator}
                  </p>
                </div>
                <Thumb src={main?.image} alt={main?.title ?? ''} className="size-18" />
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
