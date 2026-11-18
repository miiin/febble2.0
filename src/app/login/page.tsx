import Image from 'next/image';
import Link from 'next/link';
import LoginButtons from '@/components/auth/LoginButtons';
import { isLoggedIn } from '@/mocks/session';

// 로그인 페이지. 대부분은 로그인 시트로 처리하고, 이 페이지는 직접 들어오거나
// 로그인이 필요한 주소에서 넘어올 때 쓴다.
export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100dvh-3.75rem)] flex-col px-4 pt-16 pb-10">
      <div className="flex-1">
        <Image src="/images/icon/flag2.svg" alt="" width={33} height={25} />
        <h1 className="mt-6 font-display text-[32px] leading-tight tracking-[-0.02em]">
          See You <span className="font-serif">Somewhere</span> Loud
        </h1>
        <p className="mt-3 text-sm leading-relaxed tracking-[-0.04em]">
          좋아하는 아티스트를 팔로우하고,
          <br />
          보고 싶은 공연과 무대를 모아두세요.
        </p>
      </div>

      {isLoggedIn ? (
        <div className="text-center">
          <p className="text-sm">이미 로그인돼 있어요.</p>
          <Link href="/me" className="mt-4 flex h-12 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm">
            마이페이지로 가기
          </Link>
        </div>
      ) : (
        <LoginButtons />
      )}
    </main>
  );
}
