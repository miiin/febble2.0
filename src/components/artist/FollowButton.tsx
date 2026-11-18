'use client';

import { useState } from 'react';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import { isLoggedIn } from '@/mocks/session';

export default function FollowButton({ initialFollowing = false }: { initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const openLoginSheet = useOpenLoginSheet();

  const onClick = () => {
    if (!isLoggedIn) {
      openLoginSheet('아티스트를 팔로우하고\n공연 소식을 받아보세요');
      return;
    }
    setFollowing((prev) => !prev);
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
