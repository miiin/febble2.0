import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { followedArtistNews, recommendation } from '@/mocks/home';

export default function ForYouSection() {
  return (
    <section className="mx-4 mt-10 border border-black">
      <div className="px-3 pt-5 pb-3">
        <SectionTitle title="For you" />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span>팔로우한 아티스트 소식</span>
          <Link href="/me/following" className="underline underline-offset-2">
            더보기
          </Link>
        </div>
      </div>

      <ul>
        {followedArtistNews.map((item) => (
          <li key={item.id} className="relative border-t border-black">
            <Link href={`/shows/${item.id}`} className="flex items-center gap-4 px-3 py-3">
              <Thumb src={item.image} alt={item.name} className="size-14 rounded-full" />
              <div>
                <p className="font-medium tracking-[-0.04em]">{item.name}</p>
                <p className="text-xs">
                  {item.date} · {item.venue}
                </p>
              </div>
            </Link>
            {item.badge && (
              <div className="absolute top-3 right-3">
                <Badge type={item.badge.type}>{item.badge.label}</Badge>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-black px-3 pt-5 pb-6">
        <p className="text-sm tracking-[-0.04em]">{recommendation.basedOn} 좋아한다면</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {recommendation.shows.map((show) => (
            <li key={show.id}>
              <Link href={`/shows/${show.id}`}>
                <Thumb src={show.image} alt={show.title} className="aspect-square w-full" />
                <p className="mt-3 text-lg leading-tight font-medium tracking-[-0.04em]">{show.title}</p>
                <p className="mt-1 text-[11px]">
                  {show.date} · {show.venue}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
