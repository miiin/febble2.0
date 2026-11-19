'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';

// 카카오·Google 로그인 버튼과 약관 동의 안내. 로그인 시트와 /login 페이지가 같이 쓴다.
export default function LoginButtons() {
  // 로그인 후 지금 보던 화면으로 돌아온다. /login 에서 시작했으면 마이페이지로.
  // 주소는 누를 때 읽는다 (렌더 중에 읽으면 주소가 요청 때 정해지는 페이지를 미리 만들 수 없다).
  const login = (provider: 'kakao' | 'google') => {
    const { pathname, search } = window.location;
    signIn(provider, { redirectTo: pathname === '/login' ? '/me' : pathname + search });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => login('kakao')} className="flex h-12 items-center justify-center rounded-lg bg-[#FEE500] text-sm font-medium text-black/85">
          카카오로 시작하기
        </button>
        <button type="button" onClick={() => login('google')} className="flex h-12 items-center justify-center rounded-lg border border-black text-sm font-medium">
          Google로 시작하기
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-black/60">
        시작하면{' '}
        <Link href="/terms" className="underline underline-offset-2">
          이용약관
        </Link>{' '}
        및{' '}
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>
    </>
  );
}
