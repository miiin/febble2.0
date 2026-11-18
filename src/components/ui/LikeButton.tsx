'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import { isLoggedIn } from '@/mocks/session';

type Props = {
  className?: string;
};

export default function LikeButton({ className = '' }: Props) {
  const [liked, setLiked] = useState(false);
  const openLoginSheet = useOpenLoginSheet();

  // 비로그인이면 하트를 채우지 않고 로그인 시트만 띄운다.
  const onClick = () => {
    if (!isLoggedIn) {
      openLoginSheet('찜한 공연을 모아보려면\n로그인이 필요해요');
      return;
    }
    setLiked((prev) => !prev);
  };

  return (
    <button type="button" aria-label="찜하기" aria-pressed={liked} onClick={onClick} className={className}>
      <Image src={liked ? '/images/icon/heart-filled.svg' : '/images/icon/heart.svg'} alt="" width={16} height={16} />
    </button>
  );
}
