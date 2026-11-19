'use client';

import { SessionProvider, useSession } from 'next-auth/react';

// 하트·팔로우·담기처럼 클라이언트에서 로그인 여부만 알면 되는 곳을 위한 세션.
// 페이지를 미리 만들어둔 채로 두려고, 브라우저에서 /api/auth/session 을 읽어온다.
export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

/** 세션을 읽는 중에는 false */
export function useIsLoggedIn() {
  return useSession().status === 'authenticated';
}
