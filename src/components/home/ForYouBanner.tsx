'use client';

import Link from 'next/link';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { getFeaturedArtists } from '@/lib/featuredArtists';
import { MOCK_TODAY } from '@/mocks/shows';

// 비로그인 사용자에게 For you 대신 보여주는 가입 유도 배너.
// 진(zine) 카탈로그 느낌: 그라데이션 배경, 번호 붙은 그리드.
// 아티스트는 30일 안에 공연·티켓 오픈이 있는 사람 중 팔로워 많은 순 6명.
export default function ForYouBanner() {
  const openLoginSheet = useOpenLoginSheet();
  const featured = getFeaturedArtists(MOCK_TODAY);

  return (
    <section className="mx-4 mt-10 border border-black bg-linear-to-b from-[#6c66ff] to-white to-55% px-3 pt-5 pb-4">
      <SectionTitle title="For you" />

      <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-4">
        {featured.map((artist, index) => (
          <li key={artist.id}>
            <Link href={`/artists/${artist.id}`} className="block">
              <span className="text-[10px] leading-none">{index + 1}</span>
              <Thumb src={artist.image} alt={artist.name} className="mx-auto mt-1 aspect-square w-4/5 rounded-full" />
              <span className="mt-1.5 block truncate text-center text-[11px]">{artist.name}</span>
              <span className="block text-center font-plex text-[10px] italic">{artist.reason}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xl leading-snug font-medium tracking-[-0.04em]">
        좋아하는 아티스트,
        <br />
        공연 소식 놓치지 않게
      </p>

      <button
        type="button"
        onClick={() => openLoginSheet('아티스트를 팔로우하고\n공연 소식을 받아보세요')}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-black bg-[#6c66ff] text-sm text-white"
      >
        로그인하고 시작하기
      </button>
    </section>
  );
}
