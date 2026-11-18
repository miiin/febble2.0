'use client';

import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import SectionTitle from '@/components/ui/SectionTitle';

// 비로그인 사용자에게 For you 대신 보여주는 가입 유도 배너.
export default function ForYouBanner() {
  const openLoginSheet = useOpenLoginSheet();

  return (
    <section className="mx-4 mt-10 border border-black px-3 pt-5 pb-4">
      <SectionTitle title="For you" />
      <p className="mt-4 text-xl leading-snug font-medium tracking-[-0.04em]">
        좋아하는 아티스트,
        <br />
        공연 소식 놓치지 않게
      </p>
      <p className="mt-2 text-[13px] leading-snug tracking-[-0.04em]">아티스트를 팔로우하면 새 공연과 티켓 오픈 소식을 모아드려요.</p>
      <button
        type="button"
        onClick={() => openLoginSheet('아티스트를 팔로우하고\n공연 소식을 받아보세요')}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm"
      >
        로그인하고 시작하기
      </button>
    </section>
  );
}
