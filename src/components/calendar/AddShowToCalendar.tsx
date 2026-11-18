'use client';

import { useState } from 'react';
import CalendarSheet from '@/components/calendar/CalendarSheet';
import type { CalendarEvent } from '@/lib/calendar';
import { DEFAULT_TIME_ZONE, type Show } from '@/mocks/shows';

type Props = Pick<Show, 'id' | 'title' | 'venue' | 'startDate' | 'endDate' | 'startTime' | 'timeZone'>;

// 공연 상세의 "캘린더에 추가". 시작 시각이 있는 하루 공연은 시간 일정, 그 외는 종일 일정.
export default function AddShowToCalendar(show: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isTimed = !!show.startTime && show.startDate === show.endDate;

  const event: CalendarEvent = {
    uid: `show-${show.id}`,
    title: show.title,
    location: show.venue,
    // 화면에는 그리지 않고 누를 때만 쓰는 값이라 서버/브라우저 렌더 차이가 생기지 않는다
    description: typeof window === 'undefined' ? undefined : `febble 에서 보기: ${window.location.origin}/shows/${show.id}`,
    date: show.startDate,
    endDate: isTimed ? undefined : show.endDate,
    start: isTimed ? show.startTime : undefined,
    timeZone: show.timeZone ?? DEFAULT_TIME_ZONE,
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="text-xs underline underline-offset-2">
        캘린더에 추가 +
      </button>
      <CalendarSheet isOpen={isOpen} onClose={() => setIsOpen(false)} events={[event]} fileName={show.title.replaceAll(' ', '_')} />
    </>
  );
}
