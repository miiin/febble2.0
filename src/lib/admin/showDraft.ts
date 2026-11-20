// AI 가 만드는 "공연 초안" 형식과 검사. 포스터 읽기와 제보 초안이 같이 쓴다. 서버에서만 쓴다.
import 'server-only';
import { z } from 'zod';
import { DATE_RE, TIME_RE } from '@/lib/admin/validate';

// 자료에 없으면 null. 형식은 받은 뒤 한 번 더 검사한다 (cleanShowDraft).
export const ShowDraftSchema = z.object({
  title: z.string().nullable().describe('공연·페스티벌 이름. 자료에 적힌 그대로'),
  category: z
    .enum(['indie', 'overseas', 'festival'])
    .nullable()
    .describe('indie: 국내 아티스트 공연, overseas: 해외 아티스트 내한, festival: 여러 팀이 나오는 페스티벌'),
  startDate: z.string().nullable().describe('YYYY-MM-DD'),
  endDate: z.string().nullable().describe('YYYY-MM-DD. 하루 공연이면 startDate 와 같게'),
  startTime: z.string().nullable().describe('공연 시작 시각 HH:mm (24시간). 날마다 다르면 첫날 기준'),
  venue: z.string().nullable().describe('공연장 이름. 지역이 같이 적혀 있으면 "공연장, 도시"'),
  timeZone: z.string().nullable().describe('공연 장소의 IANA 시간대. 한국이면 Asia/Seoul'),
  price: z.string().nullable().describe('가격 문구. 예: "55,000원", "1일권 99,000원 / 2일권 165,000원"'),
  ticketOpenAt: z.string().nullable().describe('티켓 오픈 일시 YYYY-MM-DDTHH:mm (공연 현지 시각)'),
  ticketVendors: z.array(z.object({ name: z.string(), url: z.string().nullable() })).describe('예매처. 주소가 자료에 없으면 url 은 null'),
  lineup: z
    .array(z.object({ name: z.string(), artistId: z.string().nullable().describe('아티스트 목록에 있는 같은 사람이면 그 id, 없으면 null') }))
    .describe('출연 아티스트. 자료에 나온 순서대로'),
  notes: z.array(z.string()).describe('확인이 필요한 점 (연도 추정, 읽기 어려운 글자, 자료끼리 다른 정보 등). 한국어로 짧게'),
});

export type ShowDraft = z.infer<typeof ShowDraftSchema>;

/** source: 무엇을 읽는지 (예: '공연 포스터 이미지') */
export const showDraftSystem = (source: string) => `너는 한국 인디 공연·페스티벌 큐레이션 서비스 febble 의 편집 도우미야.
${source}에서 공연 정보를 읽어 정해진 형식으로 돌려줘.

규칙:
- 자료에 실제로 적힌 정보만 쓴다. 보이지 않거나 확실하지 않은 값은 지어내지 말고 null 로 둔다.
- 연도가 없으면 요일과 오늘 날짜로 가장 가까운 미래의 연도를 고르고, notes 에 연도를 추정했다고 적는다.
- 시각은 24시간제로 바꾼다 (오후 8시 → 20:00). 개장 시각과 공연 시작 시각이 다르면 공연 시작 시각을 쓴다.
- 공연 이름이 따로 없으면 아티스트 이름과 부제를 합쳐 쓴다 (예: "WEDNESDAY / LIVE IN SEOUL" → "Wednesday Live in Seoul").
- 라인업은 아래 아티스트 목록과 이름이 같은 사람(한글/영문 표기 차이 포함)이면 그 id 를 쓰고, 없으면 artistId 를 null 로 둔다.
- 예매처는 로고나 글자로 판단한다 (예: 인터파크 티켓, 멜론티켓, YES24 티켓). 주소는 자료에 적혀 있을 때만 쓴다.`;

export const artistListText = (artists: { id: string; name: string }[]) =>
  `아티스트 목록 (id: 이름):\n${artists.map((a) => `${a.id}: ${a.name}`).join('\n')}`;

// 'ticket.yes24.com' 처럼 https:// 없이 적힌 경우가 많아 붙여준다.
function vendorUrl(value: string | null) {
  const url = value?.trim();
  if (!url) return null;
  if (/^https?:\/\/\S+$/.test(url)) return url;
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(url) ? `https://${url}` : null;
}

// 형식이 어긋난 값은 버린다. 없는 아티스트 id 도 연결하지 않는다.
export function cleanShowDraft(draft: ShowDraft, artistIds: Set<string>): ShowDraft {
  const date = (value: string | null) => (value && DATE_RE.test(value) ? value : null);
  const time = (value: string | null) => (value && TIME_RE.test(value) ? value : null);
  const timeZone = (value: string | null) => {
    if (!value) return null;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return value;
    } catch {
      return null;
    }
  };
  const startDate = date(draft.startDate);
  return {
    ...draft,
    startDate,
    endDate: date(draft.endDate) ?? startDate,
    startTime: time(draft.startTime),
    timeZone: timeZone(draft.timeZone),
    ticketOpenAt: draft.ticketOpenAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.ticketOpenAt) ? draft.ticketOpenAt : null,
    ticketVendors: draft.ticketVendors.map((vendor) => ({ ...vendor, url: vendorUrl(vendor.url) })),
    lineup: draft.lineup.map((item) => ({ ...item, artistId: item.artistId && artistIds.has(item.artistId) ? item.artistId : null })),
  };
}
