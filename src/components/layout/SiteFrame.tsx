import DesktopAside from '@/components/layout/DesktopAside';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

// 공개 화면 틀. 모바일 전용 레이아웃이라 폭을 max-w-mobile 로 묶는다. PC 에서는 양옆을 DesktopAside 가 채운다.
// (site) 레이아웃과 404 가 같이 쓴다.
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopAside />
      <div className="relative mx-auto min-h-dvh w-full max-w-mobile bg-white lg:shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_8px_40px_rgb(0_0_0/0.08)]">
        <Header />
        {children}
        <Footer />
      </div>
    </>
  );
}
