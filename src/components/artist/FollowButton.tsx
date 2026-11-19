'use client';

import { useIsLoggedIn } from '@/components/auth/AuthSessionProvider';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import { useUserState } from '@/components/auth/UserStateProvider';

type Props = {
  artistId: string;
  /** 목록을 받아오기 전까지 보여줄 값 (팔로우 목록 화면은 true) */
  initialFollowing?: boolean;
};

export default function FollowButton({ artistId, initialFollowing = false }: Props) {
  const userState = useUserState();
  const following = userState.isLoaded ? userState.has('follow', artistId) : initialFollowing;
  const openLoginSheet = useOpenLoginSheet();
  const isLoggedIn = useIsLoggedIn();

  const onClick = () => {
    if (!isLoggedIn) {
      openLoginSheet('아티스트를 팔로우하고\n공연 소식을 받아보세요');
      return;
    }
    userState.toggle('follow', artistId);
  };

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={onClick}
      className={`h-9 rounded-full border border-black px-5 text-sm ${following ? 'bg-white' : 'bg-black text-white'}`}
    >
      {following ? '팔로잉' : '팔로우'}
    </button>
  );
}
