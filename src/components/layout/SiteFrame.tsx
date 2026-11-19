import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

// 공개 화면 틀. 모바일 전용 레이아웃이라 폭을 max-w-mobile 로 묶는다.
// PC 대응은 이 컨테이너의 max-w 제한을 푸는 것부터 시작한다. (site) 레이아웃과 404 가 같이 쓴다.
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-mobile bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
