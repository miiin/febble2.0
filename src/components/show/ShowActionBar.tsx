'use client';

import { useState } from 'react';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import BottomSheet from '@/components/ui/BottomSheet';
import LikeButton from '@/components/ui/LikeButton';
import { formatShort } from '@/lib/date';
import { trackTicketOutbound } from '@/lib/track';
import { isLoggedIn } from '@/mocks/session';
import type { TicketStatus, TicketVendor } from '@/mocks/shows';

type Props = {
  showId: string;
  status: TicketStatus;
  vendors: TicketVendor[];
  ticketOpenAt?: string;
  hasTimetable: boolean;
};

const PRIMARY = 'flex h-11 flex-1 flex-col items-center justify-center rounded-lg border border-black bg-black text-white text-sm';
const SECONDARY = 'flex h-11 shrink-0 items-center justify-center rounded-lg border border-black px-4 text-sm';
const MUTED = 'flex h-11 flex-1 items-center justify-center rounded-lg border border-black/20 text-sm text-black/50';

// 공연 상세 하단 고정 바. 판매 상태에 따라 큰 버튼(주 행동)이 바뀐다.
// - 오픈 전: 티켓 오픈 알림 받기 (서비스 안에 남는 행동)
// - 예매 중: 예매처로 나가는 링크 (어디로 가는지 이름과 ↗ 로 표시)
// - 매진 / 종료: 흐리게 상태만 알리고, 매진이면 예매처 링크를 작게
// - 타임테이블이 있는 페스티벌: 내 타임테이블 만들기가 주 행동, 예매·알림은 보조
export default function ShowActionBar({ showId, status, vendors, ticketOpenAt, hasTimetable }: Props) {
  const [isNotifying, setIsNotifying] = useState(false);
  const [isVendorSheetOpen, setIsVendorSheetOpen] = useState(false);
  const openLoginSheet = useOpenLoginSheet();

  const toggleNotify = () => {
    if (!isLoggedIn) {
      openLoginSheet('티켓 오픈 전에\n알림을 보내드릴게요');
      return;
    }
    setIsNotifying((prev) => !prev);
  };

  const openLabel = ticketOpenAt ? `${formatShort(ticketOpenAt.slice(0, 10))} ${ticketOpenAt.slice(11)} 오픈` : undefined;
  const singleVendor = vendors.length === 1 ? vendors[0] : undefined;

  // 예매처가 하나면 바로 나가는 링크, 여러 곳이면 선택 시트.
  const vendorAction = (label: string, className: string) =>
    singleVendor ? (
      <a
        href={singleVendor.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackTicketOutbound({ showId, vendor: singleVendor.name, source: 'show-detail' })}
        className={className}
      >
        {label}
      </a>
    ) : (
      <button type="button" onClick={() => setIsVendorSheetOpen(true)} className={className}>
        {label}
      </button>
    );

  const notifyAction = (compact: boolean) => (
    <button type="button" aria-pressed={isNotifying} onClick={toggleNotify} className={compact ? SECONDARY : PRIMARY}>
      {compact ? (
        isNotifying ? (
          '알림 받는 중'
        ) : (
          '오픈 알림'
        )
      ) : (
        <>
          <span>{isNotifying ? '오픈 알림 받는 중' : '티켓 오픈 알림 받기'}</span>
          {openLabel && <span className="text-[10px] leading-tight">{openLabel}</span>}
        </>
      )}
    </button>
  );

  const renderMain = () => {
    if (hasTimetable && (status === 'before-open' || status === 'on-sale')) {
      return (
        <>
          <a href="#timetable" className={PRIMARY}>
            내 타임테이블 만들기
          </a>
          {status === 'on-sale' ? vendorAction('예매 ↗', SECONDARY) : notifyAction(true)}
        </>
      );
    }

    switch (status) {
      case 'before-open':
        return notifyAction(false);
      case 'on-sale':
        return vendorAction(singleVendor ? `${singleVendor.name}에서 예매 ↗` : '예매처 선택 ↗', PRIMARY);
      case 'sold-out':
        return (
          <>
            <p className={MUTED}>매진된 공연이에요</p>
            {vendorAction('예매처 보기 ↗', 'shrink-0 px-1 text-xs underline underline-offset-2')}
          </>
        );
      case 'ended':
        return <p className={MUTED}>종료된 공연이에요</p>;
    }
  };

  return (
    <>
      <div className="sticky bottom-0 mt-10 flex items-center gap-2 border-t border-black bg-white px-4 py-3">
        {renderMain()}
        <LikeButton className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black" />
      </div>

      {vendors.length > 1 && (
        <BottomSheet isOpen={isVendorSheetOpen} onClose={() => setIsVendorSheetOpen(false)} labelledBy="vendor-sheet-title">
          <h2 id="vendor-sheet-title" className="mt-6 text-xl font-medium tracking-[-0.04em]">
            예매처 선택
          </h2>
          <p className="mt-1 text-xs text-black/60">선택한 예매처 사이트로 이동해요.</p>
          <ul className="mt-4 border-t border-black">
            {vendors.map((vendor) => (
              <li key={vendor.name} className="border-b border-black">
                <a
                  href={vendor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackTicketOutbound({ showId, vendor: vendor.name, source: 'show-detail' })}
                  className="flex items-center justify-between py-4 text-sm"
                >
                  {vendor.name}
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </>
  );
}
