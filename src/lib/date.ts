// mock 의 날짜는 'YYYY-MM-DD' 문자열. 시간대 문제를 피하려고 로컬 날짜로만 다룬다.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function parse(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** '17 DEC' */
export function formatDay(iso: string) {
  const date = parse(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** '17 DEC — 20 DEC', 하루면 '17 DEC' */
export function formatRange(start: string, end: string) {
  return start === end ? formatDay(start) : `${formatDay(start)} — ${formatDay(end)}`;
}

/** '12.17(목)' */
export function formatShort(iso: string) {
  const date = parse(iso);
  return `${date.getMonth() + 1}.${date.getDate()}(${WEEKDAYS[date.getDay()]})`;
}

/** 'DEC 2026' */
export function formatMonth(iso: string) {
  const date = parse(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** iso 에서 days 만큼 지난 날 'YYYY-MM-DD' */
export function addDays(iso: string, days: number) {
  const date = parse(iso);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 요일 번호. 0 일요일 ~ 6 토요일 */
export function weekday(iso: string) {
  return parse(iso).getDay();
}

/** from 에서 to 까지 며칠 남았는지. 지난 날짜면 음수. */
export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** '18:30' → 1110 */
export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
