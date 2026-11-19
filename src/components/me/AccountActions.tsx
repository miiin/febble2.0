'use client';

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { deleteAccount } from '@/app/me/account/actions';
import BottomSheet from '@/components/ui/BottomSheet';

// 로그아웃 · 회원 탈퇴. 탈퇴는 되돌릴 수 없으니 확인 시트를 한 번 더 띄운다.
export default function AccountActions() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  return (
    <>
      <div className="mt-10 flex flex-col gap-3">
        <button type="button" onClick={() => signOut({ redirectTo: '/' })} className="flex h-12 items-center justify-center rounded-lg border border-black text-sm">
          로그아웃
        </button>
        <button type="button" onClick={() => setIsWithdrawOpen(true)} className="py-2 text-xs text-black/50 underline underline-offset-2">
          회원 탈퇴
        </button>
      </div>

      <BottomSheet isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} labelledBy="withdraw-title">
        <h2 id="withdraw-title" className="mt-6 text-xl font-medium tracking-[-0.04em]">
          정말 탈퇴할까요?
        </h2>
        <p className="mt-2 text-sm leading-relaxed tracking-[-0.04em]">
          찜한 공연, 팔로우한 아티스트, 내 타임테이블이 모두 삭제되고 되돌릴 수 없어요.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setIsWithdrawOpen(false)}
            className="flex h-12 flex-1 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm"
          >
            계속 쓸게요
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDeleting(() => deleteAccount())}
            className="flex h-12 flex-1 items-center justify-center rounded-lg border border-black text-sm disabled:opacity-50"
          >
            {isDeleting ? '탈퇴하는 중…' : '탈퇴하기'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
