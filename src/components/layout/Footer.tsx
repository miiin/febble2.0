import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-black px-4 pt-12 pb-10">
      <Image src="/images/mrflag.svg" alt="" width={190} height={126} className="mx-auto" />
      <p className="mt-10 text-center font-display text-xl font-medium tracking-[-0.03em]">
        See You <span className="font-serif text-2xl font-normal tracking-normal">Somewhere</span> Loud
      </p>
      <div className="mt-10 flex items-center justify-between text-xs">
        <div className="flex gap-2 underline underline-offset-2">
          <Link href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            Instagram
          </Link>
          <Link href="#">공연 제보하기</Link>
        </div>
        <span>© febble</span>
      </div>
    </footer>
  );
}
