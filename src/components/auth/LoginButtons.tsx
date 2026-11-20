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
      {/* 두 버튼은 같은 크기·비중으로 둔다 (Google 가이드: 다른 로그인과 적어도 동등하게). */}
      <div className="flex flex-col gap-2">
        {/* 카카오 로그인 디자인 가이드 (공식 리소스 kakao_login_kr): 배경 #FEE500, 심볼·레이블 #191919, 레이블 "카카오 로그인" */}
        <button
          type="button"
          onClick={() => login('kakao')}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-[15px] font-medium text-[#191919]"
        >
          <svg viewBox="117.5 16.5 13 13" aria-hidden className="size-[18px]">
            <path
              d="M124.001 16.5225C120.422 16.5225 117.522 19.0037 117.522 22.0641C117.522 24.0312 118.722 25.7596 120.529 26.7423L119.918 29.2113C119.895 29.285 119.913 29.364 119.962 29.4184C119.998 29.457 120.046 29.478 120.093 29.478C120.134 29.478 120.174 29.464 120.208 29.4341L122.834 27.5144C123.212 27.5723 123.601 27.6039 123.999 27.6039C127.577 27.6039 130.478 25.1226 130.478 22.0623C130.478 19.002 127.578 16.5225 124.001 16.5225Z"
              fill="#191919"
            />
          </svg>
          카카오 로그인
        </button>
        {/* Google 로그인 브랜드 가이드 (밝은 테마): 배경 #FFFFFF, 테두리 #747775 1px, 글자 #1F1F1F Roboto Medium 14/20,
            표준 색상 G 로고 20px, 로고와 글자 사이 10px */}
        <button
          type="button"
          onClick={() => login('google')}
          className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-[#747775] bg-white px-3 font-[family-name:var(--font-roboto),var(--font-plex-kr),sans-serif] text-sm leading-5 font-medium text-[#1F1F1F]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Google 이 제공한 로고 그대로 (변형 금지) */}
          <img src="/images/auth/google-g.png" alt="" width={200} height={204} className="h-5 w-auto" />
          Google 계정으로 로그인
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
