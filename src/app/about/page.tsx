import Image from 'next/image';
import Link from 'next/link';

// 문구는 febble 1.0 About 을 옮겨왔다.
export default function AboutPage() {
  return (
    <main className="pb-14">
      <div className="bg-linear-to-b from-brand-yellow to-white px-4 pt-12 pb-10">
        <Image src="/images/mrflag.svg" alt="" width={190} height={126} className="mx-auto" />
        <h1 className="mt-10 text-center font-display text-[28px] leading-tight tracking-[-0.02em]">
          See You <span className="font-serif text-[32px]">Somewhere</span> Loud
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-4 text-[17px] leading-relaxed font-medium tracking-[-0.04em]">
        <p>무더운 여름, 페스티벌을 기다리며 설레던 우리의 마음을 담았습니다. 음악을 사랑하는 마음들이 모여 시작한 작은 프로젝트가 이제 여러분을 찾아갑니다.</p>
        <p>전세계의 페스티벌과 공연 정보를 한눈에 보고, 당신만의 특별한 순간을 만들어보세요.</p>
      </div>

      <div className="mx-4 mt-10 border border-black px-4 py-6">
        <p className="text-sm tracking-[-0.04em]">당신의 모든 페스티벌 순간이 특별해질 수 있도록</p>
        <p className="mt-2 font-logo text-[40px] leading-none tracking-[-0.04em]">Febble.</p>
        <div className="mt-6 flex gap-4 text-xs underline underline-offset-2">
          <a href="mailto:brachios.app@gmail.com">Contact us</a>
          <Link href="/report">공연 제보하기</Link>
        </div>
      </div>
    </main>
  );
}
