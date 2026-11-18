'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type Props = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

// 화면 아래에서 올라오는 로그인 시트. 닫혀 있을 때도 DOM 에 두어 열고 닫히는 애니메이션을 유지한다.
export default function LoginSheet({ isOpen, message, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div className={`fixed inset-0 z-20 ${isOpen ? 'visible' : 'invisible'}`} aria-hidden={!isOpen}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-sheet-title"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-mobile border-t border-black bg-white px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-black/20" />

        <h2 id="login-sheet-title" className="mt-6 text-xl leading-snug font-medium tracking-[-0.04em] whitespace-pre-line">
          {message}
        </h2>

        <div className="mt-6 flex flex-col gap-2">
          {/* TODO: 로그인 연동 시 signIn('kakao') */}
          <button type="button" className="flex h-12 items-center justify-center rounded-lg bg-[#FEE500] text-sm font-medium text-black/85">
            카카오로 시작하기
          </button>
          {/* TODO: 로그인 연동 시 signIn('google') */}
          <button type="button" className="flex h-12 items-center justify-center rounded-lg border border-black text-sm font-medium">
            Google로 시작하기
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-black/60">
          시작하면{' '}
          <Link href="#" className="underline underline-offset-2">
            이용약관
          </Link>{' '}
          및{' '}
          <Link href="#" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
