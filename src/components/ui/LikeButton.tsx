'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useIsLoggedIn } from '@/components/auth/AuthSessionProvider';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import { useUserState } from '@/components/auth/UserStateProvider';

type Props = {
  showId: string;
  className?: string;
};

export default function LikeButton({ showId, className = '' }: Props) {
  const userState = useUserState();
  const liked = userState.has('like', showId);
  const openLoginSheet = useOpenLoginSheet();
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  // 비로그인이면 하트를 채우지 않고 로그인 시트만 띄운다.
  const onClick = () => {
    if (!isLoggedIn) {
      openLoginSheet('찜한 공연을 모아보려면\n로그인이 필요해요');
      return;
    }
    userState.toggle('like', showId);
    // 찜한 공연이 어디에 모이는지 알려준다. 찜을 풀 때는 띄우지 않는다.
    if (!liked && userState.isLoaded) toast('내 공연에 담았어요', { action: { label: '보기', onClick: () => router.push('/me#liked') } });
  };

  return (
    <button type="button" aria-label="찜하기" aria-pressed={liked} onClick={onClick} className={className}>
      <Image src={liked ? '/images/icon/heart-filled.svg' : '/images/icon/heart.svg'} alt="" width={16} height={16} />
    </button>
  );
}
