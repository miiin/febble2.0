'use client';

import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';

// 로그인이 필요한 페이지에서 비로그인일 때 보여주는 안내.
export default function LoginRequired({ message }: { message: string }) {
  const openLoginSheet = useOpenLoginSheet();

  return (
    <div className="mt-10 border border-black px-4 py-10 text-center">
      <p className="text-lg leading-snug font-medium tracking-[-0.04em] whitespace-pre-line">{message}</p>
      <button
        type="button"
        onClick={() => openLoginSheet(message)}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-black bg-brand-yellow px-8 text-sm"
      >
        로그인하고 시작하기
      </button>
    </div>
  );
}
