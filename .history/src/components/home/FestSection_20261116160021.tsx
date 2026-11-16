import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { festivals } from '@/mocks/home';

export default function FestSection() {
  return (
    <section className="mt-10 px-4 pb-14">
      <SectionTitle title="Fest" sub="다가오는 페스티벌" />
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {festivals.map((fest) => (
          <li key={fest.id} className="border-t-1 border-black">
            <Thumb src={fest.image} alt={fest.title} className="aspect-square w-full" />
            <p className="mt-2 text-lg leading-tight font-medium tracking-[-0.04em]">{fest.title}</p>
            <p className="mt-1 text-[11px]">{fest.date}</p>
            <p className="text-[11px]">{fest.location}</p>
          </li>
        ))}
      </ul>

      <Link href="#" className="mt-6 flex h-12 items-center justify-between rounded-lg bg-black px-4 text-white">
        <span className="text-sm font-medium">전체 공연 보기</span>
        <span className="flex items-center gap-1 text-[11px]">
          국내 인디 · 내한
          <ArrowRight className="size-4" strokeWidth={1.6} />
        </span>
      </Link>
    </section>
  );
}
