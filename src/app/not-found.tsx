import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-16 text-center">
      <Image src="/images/icon/flag2.svg" alt="" width={33} height={25} />
      <p className="mt-6 font-display text-[56px] leading-none tracking-[-0.04em]">404</p>
      <h1 className="mt-4 text-lg font-medium tracking-[-0.04em]">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm leading-relaxed tracking-[-0.04em]">
        주소가 바뀌었거나 사라진 페이지예요.
        <br />
        공연이 없어졌다면 제보해주셔도 좋아요.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="flex h-11 items-center rounded-lg border border-black bg-brand-yellow px-6 text-sm">
          홈으로
        </Link>
        <Link href="/shows" className="flex h-11 items-center rounded-lg border border-black px-6 text-sm">
          공연 보기
        </Link>
      </div>
    </main>
  );
}
