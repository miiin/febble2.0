// KOPIS 상세 정보를 공연 초안으로 옮긴다. 항목이 정해져 있어 AI 없이 규칙으로 채우고,
// 라인업(출연진 ↔ 등록 아티스트)과 id 만 reportAI 에서 AI 로 채운다. 서버에서만 쓴다.
import 'server-only';
import type { ShowDraft } from '@/lib/admin/showDraft';
import type { KopisDetail } from '@/lib/kopis';

const SHORT_AREA: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  강원도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라북도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

// 상세 API 는 "시설 (공연장)" 으로 주는데, 공연장이 하나뿐인 시설은 같은 이름이 괄호에 한 번 더 온다.
// 맨 뒤 괄호(안에 괄호가 또 있을 수 있다)가 바깥 이름과 같으면 지운다. 다른 이름이면 둔다: "올림픽공원 (올림픽홀)"
function dropRepeatedName(venue: string) {
  if (!venue.endsWith(')')) return venue;
  let depth = 0;
  for (let i = venue.length - 1; i >= 0; i--) {
    if (venue[i] === ')') depth++;
    else if (venue[i] === '(' && --depth === 0) {
      const outer = venue.slice(0, i).trim();
      const inner = venue.slice(i + 1, -1).trim();
      return outer.replace(/\s+/g, '') === inner.replace(/\s+/g, '') ? outer : venue;
    }
  }
  return venue;
}

/** "롤링홀 (롤링홀)" + "서울특별시" → "롤링홀, 서울" */
export function kopisVenue(venue: string, area: string) {
  const name = dropRepeatedName(
    venue
      .replace(/\s*\[[^\]]*\]/g, '') // 지점 표기: [마포]
      .replace(/^\((재|사)\)\s*/, '') // 법인 표기: (재) 영화의전당
      .trim(),
  );
  const city = SHORT_AREA[area] ?? area;
  return city ? `${name}, ${city}` : name;
}

/** "토요일(18:00), 일요일(17:00)" → 첫 시각과, 시각이 여러 개인지 */
export function kopisStartTime(schedule: string) {
  const times = [...new Set([...schedule.matchAll(/\b(\d{1,2}):(\d{2})\b/g)].map((m) => `${m[1].padStart(2, '0')}:${m[2]}`))];
  return { time: times[0] ?? null, varies: times.length > 1 };
}

/** 라인업과 id 를 뺀 나머지 초안 */
export function kopisBaseDraft(kopis: KopisDetail): Omit<ShowDraft, 'slug' | 'lineup'> {
  const { time, varies } = kopisStartTime(kopis.schedule);
  const notes: string[] = [];
  if (varies) notes.push(`공연 시각이 회차마다 달라요: ${kopis.schedule}`);
  if (!time) notes.push('KOPIS 에 공연 시각이 없어요');
  return {
    title: kopis.title || null,
    category: kopis.isFestival ? 'festival' : kopis.isVisit ? 'overseas' : 'indie',
    startDate: kopis.startDate || null,
    endDate: kopis.endDate || null,
    startTime: time,
    venue: kopis.venue ? kopisVenue(kopis.venue, kopis.area) : null,
    timeZone: 'Asia/Seoul',
    price: kopis.price || null,
    ticketOpenAt: null, // KOPIS 에 없다
    ticketVendors: kopis.vendors.map((vendor) => ({ name: vendor.name, url: vendor.url || null })),
    notes,
  };
}

/** KOPIS 출연진 문구를 이름 목록으로. "실리카겔, 새소년 등" → ['실리카겔', '새소년'], "검정치마 외 3명" → ['검정치마'] */
export function castNames(cast: string | null | undefined) {
  const names = (cast ?? '')
    .split(/[,，/|·\n]+/)
    .map((name) =>
      name
        .replace(/\s+외(\s*\d+\s*(명|팀))?\s*$/, '') // 외 3명 (이름 끝 글자 '외'는 두고, 띄어 쓴 '외'만)
        .replace(/\s+등\s*$/, '') // 등
        .trim(),
    )
    .filter((name) => name && name !== '등' && name !== '외');
  return [...new Set(names)];
}
