'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  // mrflag 일러스트와 슬로건은 홈에서만 보여준다. 다른 페이지는 링크 줄만.
  const isHome = usePathname() === '/';

  return (
    <footer className={`border-t border-black px-4 ${isHome ? 'pt-12 pb-10' : 'py-6'}`}>
      {isHome && (
        <div className="mb-10">
          <Image src="/images/mrflag.svg" alt="" width={190} height={126} className="mx-auto" />
          <p className="mt-10 text-center font-display text-xl font-medium tracking-[-0.03em]">
            See You <span className="font-serif text-2xl font-normal tracking-normal">Somewhere</span> Loud
          </p>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2 underline underline-offset-2">
          <Link href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            Instagram
          </Link>
          <Link href="/report">공연 제보하기</Link>
        </div>
        <span>© febble</span>
      </div>
    </footer>
  );
}
