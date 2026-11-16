import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-black bg-white px-4">
      <Link href="/" className="font-logo text-[22px] tracking-[-0.04em]">
        Febble             <Image src="/images/icon/heart.svg" alt="" width={16} height={16} />

      </Link>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="검색">
          <Image src="/images/icon/search.svg" alt="" width={16} height={16} />
        </button>
        <button type="button" aria-label="메뉴">
          <Image src="/images/icon/menu.svg" alt="" width={16} height={12} />
        </button>
      </div>
    </header>
  );
}
