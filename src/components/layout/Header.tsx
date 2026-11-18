'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MenuLayer from './MenuLayer';

export default function Header() {
  const [isStuck, setIsStuck] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setIsStuck(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-black bg-white px-4">
      <Link href="/" aria-label="Febble" className="font-logo text-[22px] tracking-[-0.04em] flex items-center">
        <span
          aria-hidden={isStuck}
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${isStuck ? 'max-w-0 opacity-0' : 'max-w-30 pr-1 opacity-100'}`}
        >
          Febble
        </span>
        <Image src="/images/icon/flag2.svg" alt="" width={22} height={17} style={{ marginTop: '1px' }} />
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/search" aria-label="검색">
          <Image src="/images/icon/search.svg" alt="" width={16} height={16} />
        </Link>
        <button type="button" aria-label="메뉴" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(true)}>
          <Image src="/images/icon/menu.svg" alt="" width={16} height={12} />
        </button>
      </div>
      <MenuLayer isOpen={isMenuOpen} onClose={closeMenu} />
    </header>
  );
}
