import { cacheLife } from 'next/cache';

/** 서울 기준 오늘 'YYYY-MM-DD'. 미리 만든 페이지에 들어가고 1시간마다 다시 계산한다. */
export async function getToday() {
  'use cache';
  cacheLife('hours');
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}
