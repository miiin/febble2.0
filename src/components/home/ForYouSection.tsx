import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { followedArtistNews, recommendation } from '@/mocks/home';

// 로그인 사용자의 For you. 비로그인 배너(ForYouBanner)와 같은 진(zine) 톤:
// 보라 그라데이션 배경, 번호 붙은 둥근 아티스트 썸네일. 추천 영역은 기존 2열 카드 그대로.
export default function ForYouSection() {
  return (
    <section className="mx-4 mt-10 border border-black bg-linear-to-b from-[#6c66ff] to-white to-45% px-3 pt-5 pb-5">
      <SectionTitle title="For you" />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span>팔로우한 아티스트 소식</span>
        <Link href="/me/following" className="underline underline-offset-2">
          더보기
        </Link>
      </div>

      <ol className="mt-4 border-t border-black">
        {followedArtistNews.map((item, index) => (
          <li key={item.id} className="relative border-b border-black">
            <Link href={`/shows/${item.id}`} className="flex items-center gap-3 py-3 pr-20">
              <span className="w-3 self-start pt-1 text-[10px] leading-none">{index + 1}</span>
              <Thumb src={item.image} alt={item.name} className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="truncate font-medium tracking-[-0.04em]">{item.name}</p>
                <p className="truncate text-xs">
                  {item.date} · {item.venue}
                </p>
              </div>
            </Link>
            {item.badge && (
              <div className="absolute top-3 right-0">
                <Badge type={item.badge.type}>{item.badge.label}</Badge>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="pt-5 pb-1">
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
