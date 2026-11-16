import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import Thumb from '@/components/ui/Thumb';
import { pastIssueRange, pickIssue } from '@/mocks/home';

export default function PickSection() {
  const { vol, main, others } = pickIssue;

  return (
    <section className="pt-8">
      <div className="px-4">
        <h2 className="flex items-baseline">
          <span className="font-display text-[29px] font-medium tracking-[-0.02em]">Febble</span>
          <span className="font-serif text-[32px]">Pick</span>
        </h2>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm tracking-[-0.04em]">이번 호에 고른 공연 {others.length + 1}개</p>
          <span className="font-plex text-xs italic">Vol.{vol}</span>
        </div>

        <Thumb src={main.image} alt={main.title} className="mt-3 aspect-square w-full" />

        <h3 className="mt-4 font-display text-[28px] tracking-[-0.02em]">{main.title}</h3>
        <p className="mt-2 text-sm leading-relaxed tracking-[-0.04em] whitespace-pre-line">{main.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span>
            {main.date} · {main.venue}
          </span>
          <span className="text-[11px]">curated by {main.curator}</span>
        </div>

        <div className="mt-5 flex gap-3">
          <Link href="#" className="flex h-11 flex-1 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm">
            예매하러 가기
          </Link>
          <button type="button" aria-label="찜하기" className="flex size-11 items-center justify-center rounded-full border border-black">
            <Heart className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <ol className="mt-8 border-t border-black">
        {others.map((show, index) => (
          <li key={show.id} className="flex gap-3 border-b border-black px-4 py-5">
            <span className="w-7 shrink-0 font-display text-lg leading-tight">{String(index + 2).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1.5 text-lg leading-tight font-medium tracking-[-0.04em]">
                {show.title}
                {show.isToday && <span className="rounded-[50%] border border-black px-2 py-0.5 font-plex text-[9px] font-normal italic">TODAY</span>}
              </h3>
              <p className="mt-2 text-[13px] leading-snug tracking-[-0.04em]">{show.description}</p>
              <p className="mt-2 text-xs">
                {show.date} · {show.venue}
              </p>
            </div>
            <div className="relative">
              <Thumb src={show.image} alt={show.title} className="size-18" />
              <button type="button" aria-label="찜하기" className="absolute top-0.5 right-0.5">
                <Heart className="size-4" strokeWidth={1.6} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <Link href="#" className="flex items-center justify-between px-4 py-3 text-xs">
        지난 호 보기 {pastIssueRange}
        <ArrowRight className="size-5" strokeWidth={1.6} />
      </Link>
    </section>
  );
}
