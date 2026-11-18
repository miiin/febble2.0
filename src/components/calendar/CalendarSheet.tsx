'use client';

import BottomSheet from '@/components/ui/BottomSheet';
import { type CalendarEvent, downloadIcs, googleCalendarUrl } from '@/lib/calendar';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  fileName: string;
};

const OPTION = 'flex h-12 w-full items-center justify-between rounded-lg border border-black px-4 text-sm';

// 캘린더 앱 선택 시트. 일정이 1개면 Google 캘린더 링크, 그 외는 .ics 파일.
export default function CalendarSheet({ isOpen, onClose, events, fileName }: Props) {
  const single = events.length === 1 ? events[0] : undefined;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} labelledBy="calendar-sheet-title">
      <h2 id="calendar-sheet-title" className="mt-6 text-xl font-medium tracking-[-0.04em]">
        캘린더에 추가
      </h2>
      <p className="mt-1 text-xs text-black/60">{single ? single.title : `담은 무대 ${events.length}개`}</p>

      <div className="mt-5 flex flex-col gap-2">
        {single && (
          // 링크 주소를 렌더 때 만들지 않고 누를 때 연다 (설명에 들어가는 페이지 주소가 브라우저에서만 정해짐)
          <button
            type="button"
            onClick={() => {
              window.open(googleCalendarUrl(single), '_blank', 'noopener,noreferrer');
              onClose();
            }}
            className={OPTION}
          >
            Google 캘린더
            <span aria-hidden>↗</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            downloadIcs(events, fileName);
            onClose();
          }}
          className={OPTION}
        >
          {single ? 'Apple · 삼성 · Outlook (.ics 파일)' : '캘린더 파일 받기 (.ics)'}
          <span aria-hidden>↓</span>
        </button>
      </div>

      {!single && <p className="mt-3 text-[11px] leading-snug text-black/60">Google 캘린더는 받은 파일을 설정 → 가져오기로 추가할 수 있어요.</p>}
    </BottomSheet>
  );
}
