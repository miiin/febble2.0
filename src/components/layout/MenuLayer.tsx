'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useIsLoggedIn } from '@/components/auth/AuthSessionProvider';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';

const LINKS = [
  { href: '/shows', label: 'Shows', sub: '전체 공연' },
  { href: '/shows?category=festival', label: 'Festivals', sub: '페스티벌' },
  { href: '/artists', label: 'Artists', sub: '아티스트' },
  { href: '/pick', label: 'Pick', sub: '지난 호' },
  { href: '/tickets', label: 'Tickets', sub: '티켓 오픈 일정' },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// 헤더 메뉴 버튼으로 여는 전체 화면 메뉴.
export default function MenuLayer({ isOpen, onClose }: Props) {
  const openLoginSheet = useOpenLoginSheet();
  const isLoggedIn = useIsLoggedIn();

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-30 mx-auto flex max-w-mobile flex-col bg-white transition-opacity duration-200 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
    >
      <div className="flex h-15 shrink-0 items-center justify-between border-b border-black px-4">
        <span className="font-logo text-[22px] tracking-[-0.04em]">Febble</span>
        <button type="button" onClick={onClose} className="font-plex text-sm italic">
          Close
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul>
          {LINKS.map((link) => (
            <li key={link.label} className="border-b border-black">
              <Link href={link.href} onClick={onClose} className="flex items-baseline justify-between px-4 py-5">
                <span className="font-serif text-[40px] leading-none">{link.label}</span>
                <span className="text-xs">{link.sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t border-black px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {isLoggedIn ? (
          <Link href="/me" onClick={onClose} className="flex h-11 items-center justify-center rounded-lg border border-black text-sm">
            마이페이지
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              openLoginSheet();
            }}
            className="flex h-11 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm"
          >
            로그인
          </button>
        )}
        <Link href="/report" onClick={onClose} className="text-center text-xs underline underline-offset-2">
          공연 제보하기
        </Link>
      </div>
    </div>
  );
}
