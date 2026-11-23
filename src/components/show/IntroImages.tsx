'use client';

import { useEffect, useRef, useState } from 'react';

const COLLAPSED = 560; // 이보다 길면 접어 둔다 (라인업 이미지 한 장은 보통 다 보인다)

// 공연 안내 이미지. 세로로 긴 공지 이미지거나 여러 장이라 길어지면 윗부분만 보여주고 펼쳐 보게 한다.
export default function IntroImages({ images }: { images: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [isLong, setIsLong] = useState(false);
  const [open, setOpen] = useState(false);
  // 이미지가 화면 연결(hydration) 전에 다 받아져 onLoad 를 놓칠 수 있어, 상자 크기 변화를 지켜본다.
  useEffect(() => {
    const element = box.current!;
    const observer = new ResizeObserver(() => setIsLong(element.scrollHeight > COLLAPSED + 80));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const collapsed = isLong && !open;

  return (
    <div>
      <div ref={box} className="relative overflow-hidden" style={collapsed ? { maxHeight: COLLAPSED } : undefined}>
        {images.map((src) => (
          // 길이가 제각각인 이미지를 원래 비율로 이어 붙인다 (올릴 때 긴 변 1600px 로 줄여 두었다).
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading="lazy" className="block w-full" />
        ))}
        {collapsed && <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-white" />}
      </div>
      {isLong && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-2 w-full border border-black py-2.5 text-sm">
          {open ? '접기' : '펼쳐 보기'}
        </button>
      )}
    </div>
  );
}
