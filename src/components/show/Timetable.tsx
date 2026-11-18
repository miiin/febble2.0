'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import { formatShort, toMinutes } from '@/lib/date';
import type { Artist } from '@/mocks/artists';
import { isLoggedIn } from '@/mocks/session';
import type { Stage, TimetableSlot } from '@/mocks/shows';

type Props = {
  stages: Stage[];
  slots: TimetableSlot[];
  artistNames: Record<Artist['id'], string>;
};

const HOUR_HEIGHT = 64; // px

// 날짜 탭 → 무대별 세로 시간표. 공연 칸을 누르면 내 타임테이블에 담긴다(노란색).
export default function Timetable({ stages, slots, artistNames }: Props) {
  const dates = [...new Set(slots.map((slot) => slot.date))].sort();
  const [date, setDate] = useState(dates[0]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const openLoginSheet = useOpenLoginSheet();

  const daySlots = slots.filter((slot) => slot.date === date);
  const startHour = Math.floor(Math.min(...daySlots.map((slot) => toMinutes(slot.start))) / 60);
  const endHour = Math.ceil(Math.max(...daySlots.map((slot) => toMinutes(slot.end))) / 60);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const toggle = (slotId: string) => {
    if (!isLoggedIn) {
      openLoginSheet('보고 싶은 무대를 담아\n나만의 타임테이블을 만들어보세요');
      return;
    }
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  return (
    <div>
      <div className="flex gap-2">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDate(d)}
            aria-pressed={d === date}
            className={`h-8 rounded-full border border-black px-3 text-xs ${d === date ? 'bg-black text-white' : ''}`}
          >
            {formatShort(d)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex border-t border-black">
        <div className="w-10 shrink-0" />
        {stages.map((stage) => (
          <p key={stage.id} className="flex-1 border-l border-black py-2 text-center font-plex text-xs italic">
            {stage.name}
          </p>
        ))}
      </div>

      <div className="relative flex border-y border-black" style={{ height: (endHour - startHour) * HOUR_HEIGHT }}>
        <div className="relative w-10 shrink-0">
          {hours.slice(0, -1).map((hour, i) => (
            <span key={hour} className={`absolute text-[10px] ${i > 0 ? '-translate-y-1/2' : 'pt-0.5'}`} style={{ top: i * HOUR_HEIGHT }}>
              {hour}:00
            </span>
          ))}
        </div>

        {stages.map((stage) => (
          <div key={stage.id} className="relative flex-1 border-l border-black">
            {hours.slice(1, -1).map((_, i) => (
              <div key={i} className="absolute inset-x-0 border-t border-black/10" style={{ top: (i + 1) * HOUR_HEIGHT }} />
            ))}

            {daySlots
              .filter((slot) => slot.stageId === stage.id)
              .map((slot) => {
                const top = ((toMinutes(slot.start) - startHour * 60) / 60) * HOUR_HEIGHT;
                const height = ((toMinutes(slot.end) - toMinutes(slot.start)) / 60) * HOUR_HEIGHT;
                const isPicked = picked.has(slot.id);

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggle(slot.id)}
                    aria-pressed={isPicked}
                    className={`absolute inset-x-1 flex flex-col items-start overflow-hidden border border-black p-1.5 text-left transition-colors ${isPicked ? 'bg-brand-yellow' : 'bg-white'}`}
                    style={{ top, height }}
                  >
                    <span className="text-[13px] leading-tight font-medium tracking-[-0.04em]">{artistNames[slot.artistId]}</span>
                    <span className="mt-0.5 text-[10px]">
                      {slot.start} – {slot.end}
                    </span>
                    <Image
                      src={isPicked ? '/images/icon/heart-filled.svg' : '/images/icon/heart.svg'}
                      alt=""
                      width={12}
                      height={12}
                      className="absolute right-1.5 bottom-1.5"
                    />
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
