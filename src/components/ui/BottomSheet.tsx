'use client';

import { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** 시트 제목 요소의 id (aria-labelledby) */
  labelledBy: string;
  children: React.ReactNode;
};

// 화면 아래에서 올라오는 시트. 닫혀 있을 때도 DOM 에 두어 열고 닫히는 애니메이션을 유지한다.
// 배경·Esc 로 닫히고, 열려 있는 동안 뒤 페이지 스크롤을 막는다.
export default function BottomSheet({ isOpen, onClose, labelledBy, children }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div className={`fixed inset-0 z-20 ${isOpen ? 'visible' : 'invisible'}`} aria-hidden={!isOpen}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-mobile border-t border-black bg-white px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-black/20" />
        {children}
      </div>
    </div>
  );
}
