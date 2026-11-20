'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import QRCode from 'qrcode';

// PC(1024px 이상)에서 가운데 모바일 화면 오른쪽 아래에, 지금 보는 화면을 폰으로 여는 QR 을 둔다.
// 오른쪽 여백(전체 폭에서 모바일 화면 폭을 뺀 반)을 차지한다.
export default function DesktopAside() {
  return (
    <aside className="fixed inset-y-0 right-0 hidden w-[calc((100%-var(--container-mobile))/2)] flex-col justify-end px-10 pb-10 lg:flex">
      <PhoneQr />
    </aside>
  );
}

// 주소는 브라우저에서만 알 수 있어 그린 뒤에 만든다. 화면을 옮기면 그 주소로 다시 만든다.
function PhoneQr() {
  const pathname = usePathname();
  const [svg, setSvg] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(window.location.href, { type: 'svg', margin: 0, color: { dark: '#000000', light: '#00000000' } }).then((value) => {
      if (!cancelled) setSvg(value);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="w-36 rounded-xl border border-black bg-white p-3">
      {/* qrcode 라이브러리가 만든 SVG 문자열 (사용자 입력이 아니라 지금 주소로만 만든다) */}
      <div className="aspect-square w-full [&_svg]:size-full" dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
      <p className="mt-2.5 text-center text-xs font-medium">폰으로 이어서 보기</p>
    </div>
  );
}
