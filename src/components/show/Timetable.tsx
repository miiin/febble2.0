'use client';

import { useState } from 'react';
import Image from 'next/image';
import ArtistPreviewSheet from '@/components/artist/ArtistPreviewSheet';
import { useOpenLoginSheet } from '@/components/auth/LoginSheetProvider';
import CalendarSheet from '@/components/calendar/CalendarSheet';
import type { CalendarEvent } from '@/lib/calendar';
import { formatShort, toMinutes } from '@/lib/date';
import { drawWallpaper, getWallpaperSize, saveCanvas } from '@/lib/wallpaper';
import type { Artist } from '@/mocks/artists';
import { isLoggedIn } from '@/mocks/session';
import type { Stage, TimetableSlot } from '@/mocks/shows';

type Props = {
  showId: string;
  /** 페스티벌 이름 (배경화면 이미지·캘린더 일정에 들어간다) */
  title: string;
  venue: string;
  timeZone: string;
  stages: Stage[];
  slots: TimetableSlot[];
  artists: Artist[];
};

const HOUR_HEIGHT = 64; // px

// 날짜 탭 → 무대별 세로 시간표. 공연 칸을 누르면 내 타임테이블에 담긴다(노란색).
export default function Timetable({ showId, title, venue, timeZone, stages, slots, artists }: Props) {
  const artistNames = Object.fromEntries(artists.map((artist) => [artist.id, artist.name]));
  // 미리듣기 시트: 닫는 동안에도 내용이 남도록 마지막 칸 id 는 유지하고 열림 여부만 바꾼다.
  const [previewSlotId, setPreviewSlotId] = useState<string>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
      setIsPreviewOpen(false); // 시트가 겹치지 않게 미리듣기를 먼저 닫는다
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

  const previewSlot = slots.find((slot) => slot.id === previewSlotId);

  // 선택한 날짜에 담은 무대만 시간 순으로 배경화면 이미지로 저장한다.
  const pickedToday = daySlots.filter((slot) => picked.has(slot.id)).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const [isSaving, setIsSaving] = useState(false);

  // 캘린더: 모든 날짜의 담은 무대를 한 번에 내보낸다.
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const stageName = (stageId: string) => stages.find((stage) => stage.id === stageId)?.name ?? '';
  const calendarEvents: CalendarEvent[] = slots
    .filter((slot) => picked.has(slot.id))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .map((slot) => ({
      uid: `${showId}-${slot.id}`,
      title: `${artistNames[slot.artistId]} @ ${stageName(slot.stageId)}`,
      location: venue,
      description: title,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      timeZone,
    }));

  const saveWallpaper = async () => {
    setIsSaving(true);
    try {
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      Object.assign(canvas, getWallpaperSize());
      drawWallpaper(canvas, {
        title,
        dateLabel: formatShort(date),
        rows: pickedToday.map((slot) => ({
          start: slot.start,
          end: slot.end,
          artist: artistNames[slot.artistId],
          stage: stages.find((stage) => stage.id === slot.stageId)?.name ?? '',
        })),
        fontFamily: getComputedStyle(document.body).fontFamily,
      });
      await saveCanvas(canvas, `${title}_${date}.png`.replaceAll(' ', '_'));
    } finally {
      setIsSaving(false);
    }
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

                // 칸을 누르면 미리듣기 시트, 하트는 바로 담기/빼기.
                return (
                  <div
                    key={slot.id}
                    className={`absolute inset-x-1 overflow-hidden border border-black transition-colors ${isPicked ? 'bg-brand-yellow' : 'bg-white'}`}
                    style={{ top, height }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSlotId(slot.id);
                        setIsPreviewOpen(true);
                      }}
                      className="flex size-full flex-col items-start p-1.5 text-left"
                    >
                      <span className="text-[13px] leading-tight font-medium tracking-[-0.04em]">{artistNames[slot.artistId]}</span>
                      <span className="mt-0.5 text-[10px]">
                        {slot.start} – {slot.end}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${artistNames[slot.artistId]} 담기`}
                      aria-pressed={isPicked}
                      onClick={() => toggle(slot.id)}
                      className="absolute right-0 bottom-0 flex size-7 items-center justify-center"
                    >
                      <Image src={isPicked ? '/images/icon/heart-filled.svg' : '/images/icon/heart.svg'} alt="" width={12} height={12} />
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={saveWallpaper}
        disabled={pickedToday.length === 0 || isSaving}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-lg border border-black text-sm disabled:border-black/20 disabled:text-black/40"
      >
        {pickedToday.length === 0
          ? '무대를 담으면 배경화면으로 저장할 수 있어요'
          : isSaving
            ? '이미지 만드는 중…'
            : `${formatShort(date)} 내 타임테이블 배경화면 저장`}
      </button>

      {calendarEvents.length > 0 && (
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg border border-black text-sm"
        >
          담은 무대 {calendarEvents.length}개 캘린더에 추가
        </button>
      )}
      <CalendarSheet
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        events={calendarEvents}
        fileName={`${title}_내_타임테이블`.replaceAll(' ', '_')}
      />

      {previewSlot && (
        <ArtistPreviewSheet
          artist={isPreviewOpen ? artists.find((artist) => artist.id === previewSlot.artistId) : undefined}
          onClose={() => setIsPreviewOpen(false)}
          slot={{
            label: `${formatShort(previewSlot.date)} ${previewSlot.start} – ${previewSlot.end} · ${stages.find((stage) => stage.id === previewSlot.stageId)?.name ?? ''}`,
            isPicked: picked.has(previewSlot.id),
            onTogglePick: () => toggle(previewSlot.id),
          }}
        />
      )}
    </div>
  );
}
