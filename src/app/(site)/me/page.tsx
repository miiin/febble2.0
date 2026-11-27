import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoginRequired from '@/components/auth/LoginRequired';
import ShowRow from '@/components/show/ShowRow';
import SectionTitle from '@/components/ui/SectionTitle';
import { getShow } from '@/lib/catalog';
import { getCurrentUser, getFollowedArtistIds, getLikedShowIds, getPickedSlotIds, PROVIDER_LABEL } from '@/lib/user';
import { sortByDate } from '@/mocks/shows';

const MENU = [
  { href: '/me/account', label: '계정 설정' },
  { href: '/report', label: '공연 제보하기' },
  { href: '/about', label: 'febble 소개' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
];

export default function MyPage() {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="My" />
      <Suspense>
        <My />
      </Suspense>
    </main>
  );
}

async function My() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <LoginRequired message={'찜한 공연과 내 타임테이블을\n한곳에서 모아보세요'} />;

  const [followedArtistIds, likedShowIds, pickedSlotIds] = await Promise.all([
    getFollowedArtistIds(currentUser.id),
    getLikedShowIds(currentUser.id),
    getPickedSlotIds(currentUser.id),
  ]);
  const liked = sortByDate((await Promise.all(likedShowIds.map(getShow))).filter((show) => show !== undefined));
  const timetables = (
    await Promise.all(Object.entries(pickedSlotIds).map(async ([showId, slotIds]) => ({ show: await getShow(showId), count: slotIds.length })))
  ).filter((item) => item.show && item.count > 0);

  return (
    <>
      <div className="mt-5 flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black bg-brand-yellow font-display text-xl">
          {currentUser.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-medium tracking-[-0.04em]">{currentUser.name}</p>
          <p className="text-xs">
            {PROVIDER_LABEL[currentUser.provider]}로 로그인{currentUser.email && ` · ${currentUser.email}`}
          </p>
        </div>
      </div>

      <section id="liked" className="mt-10 scroll-mt-16">
        <h2 className="flex items-baseline gap-1.5">
          <span className="font-serif text-[28px] leading-none">Liked</span>
          <span className="text-sm tracking-[-0.04em]">찜한 공연 {liked.length}</span>
        </h2>
        {liked.length > 0 ? (
          <ul className="mt-3 border-t-2 border-black">
            {liked.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">하트를 눌러 보고 싶은 공연을 모아보세요.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="flex items-baseline gap-1.5">
          <span className="font-serif text-[28px] leading-none">Timetable</span>
          <span className="text-sm tracking-[-0.04em]">내가 짠 타임테이블</span>
        </h2>
        {timetables.length > 0 ? (
          <ul className="mt-3 border-t-2 border-black">
            {timetables.map(({ show, count }) => (
              <li key={show!.id} className="border-b border-black">
                <Link href={`/shows/${show!.id}#timetable`} className="flex items-center justify-between py-3 pl-2">
                  <span className="font-medium tracking-[-0.04em]">{show!.title}</span>
                  <span className="flex items-center gap-2 text-xs">
                    무대 {count}개
                    <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">페스티벌 타임테이블에서 보고 싶은 무대를 담아보세요.</p>
        )}
      </section>

      <Link href="/me/following" className="mt-10 flex items-center justify-between border-y-2 border-black py-4">
        <span className="flex items-baseline gap-1.5">
          <span className="font-serif text-[28px] leading-none">Following</span>
          <span className="text-sm tracking-[-0.04em]">팔로우 중 {followedArtistIds.length}</span>
        </span>
        <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} />
      </Link>

      <ul className="mt-10 border-t border-black">
        {MENU.map((item) => (
          <li key={item.href} className="border-b border-black">
            <Link href={item.href} className="block py-3.5 text-sm">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
