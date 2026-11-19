'use client';

import { createContext, use, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { setArtistFollowed, setShowLiked } from '@/lib/userActions';

type Kind = 'like' | 'follow';

type UserState = {
  /** 목록을 받아오기 전에는 false. 그동안 버튼은 initial 값을 쓴다. */
  isLoaded: boolean;
  has: (kind: Kind, id: string) => boolean;
  toggle: (kind: Kind, id: string) => void;
};

const UserStateContext = createContext<UserState | null>(null);

const SAVE = { like: setShowLiked, follow: setArtistFollowed };

// 로그인한 사용자의 찜·팔로우 목록. 같은 공연·아티스트 버튼이 여러 개여도 같이 바뀐다.
// 누르면 화면부터 바꾸고 서버에 저장하며, 실패하면 되돌린다.
export default function UserStateProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<Record<Kind, Set<string>> | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let ignore = false;
    fetch('/api/me/state')
      .then((res) => res.json())
      .then((data: { likedShowIds: string[]; followedArtistIds: string[] }) => {
        if (!ignore) setIds({ like: new Set(data.likedShowIds), follow: new Set(data.followedArtistIds) });
      });
    return () => {
      ignore = true;
    };
  }, [status]);

  const update = useCallback((kind: Kind, id: string, on: boolean) => {
    setIds((prev) => {
      if (!prev) return prev;
      const next = new Set(prev[kind]);
      if (on) next.add(id);
      else next.delete(id);
      return { ...prev, [kind]: next };
    });
  }, []);

  const loaded = status === 'authenticated' && ids !== null;

  const value: UserState = {
    isLoaded: loaded,
    has: (kind, id) => !!ids?.[kind].has(id),
    toggle: (kind, id) => {
      if (!ids) return;
      const on = !ids[kind].has(id);
      update(kind, id, on);
      SAVE[kind](id, on).catch(() => update(kind, id, !on));
    },
  };

  return <UserStateContext value={value}>{children}</UserStateContext>;
}

export function useUserState() {
  const state = use(UserStateContext);
  if (!state) throw new Error('UserStateProvider 안에서 써야 해요');
  return state;
}
