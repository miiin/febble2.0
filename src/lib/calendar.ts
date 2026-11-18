// 캘린더 연동 1단계: 로그인·API 없이 일정 내보내기.
// - Google 캘린더: 일정 추가 링크 (일정 1개일 때)
// - 그 외(Apple·삼성·Outlook, 여러 일정): .ics 파일
// 시간은 공연지 시간대 기준으로 받아 UTC 로 바꿔 넣는다. 해외 공연도 캘린더에서 시간이 어긋나지 않는다.

export type CalendarEvent = {
  uid: string;
  title: string;
  location?: string;
  description?: string;
  date: string; // 'YYYY-MM-DD'
  /** 여러 날 종일 일정의 마지막 날 (포함) */
  endDate?: string;
  /** 'HH:mm'. 없으면 종일 일정 */
  start?: string;
  /** 'HH:mm'. 없으면 start + 2시간. start 보다 이르면 다음 날로 본다 (자정 넘는 공연) */
  end?: string;
  timeZone: string;
};

const DEFAULT_DURATION_MIN = 120;

/** timeZone 에서 ts(UTC ms) 순간의 UTC 와의 차이(ms) */
function tzOffset(ts: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(ts)
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - Math.floor(ts / 60_000) * 60_000;
}

/** 공연지 현지 날짜·시각 → UTC ms */
function zonedToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const local = Date.UTC(y, m - 1, d, hh, mm);
  const first = local - tzOffset(local, timeZone);
  return local - tzOffset(first, timeZone); // 서머타임 경계 보정
}

const toUtcStamp = (ts: number) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20271001T103000Z
const toDateStamp = (date: string) => date.replaceAll('-', ''); // 20271001

function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** [DTSTART, DTEND] 값. 종일은 'YYYYMMDD'(끝은 다음 날, 미포함), 시간 일정은 UTC */
function range(event: CalendarEvent) {
  if (!event.start) {
    return { allDay: true, start: toDateStamp(event.date), end: toDateStamp(addDays(event.endDate ?? event.date, 1)) };
  }
  const start = zonedToUtc(event.date, event.start, event.timeZone);
  let end = event.end ? zonedToUtc(event.date, event.end, event.timeZone) : start + DEFAULT_DURATION_MIN * 60_000;
  if (end <= start) end += 24 * 60 * 60_000;
  return { allDay: false, start: toUtcStamp(start), end: toUtcStamp(end) };
}

export function googleCalendarUrl(event: CalendarEvent) {
  const { start, end } = range(event);
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${start}/${end}` });
  if (event.location) params.set('location', event.location);
  if (event.description) params.set('details', event.description);
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545: 한 줄은 75바이트를 넘지 않게 접는다 (한글은 글자당 3바이트) */
function fold(line: string) {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (chunks.length === 0 ? 75 : 74)) {
      chunks.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join('\r\n ');
}

export function buildIcs(events: CalendarEvent[]) {
  const stamp = toUtcStamp(Date.now());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//febble//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];

  for (const event of events) {
    const { allDay, start, end } = range(event);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}@febble`,
      `DTSTAMP:${stamp}`,
      allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
      allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
      `SUMMARY:${escapeText(event.title)}`,
    );
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(events: CalendarEvent[], fileName: string) {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.ics') ? fileName : `${fileName}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
