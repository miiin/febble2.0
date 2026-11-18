'use client';

import Link from 'next/link';
import BottomSheet from '@/components/ui/BottomSheet';

type Props = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

export default function LoginSheet({ isOpen, message, onClose }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} labelledBy="login-sheet-title">
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
    </BottomSheet>
  );
}
