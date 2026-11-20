// KOPIS(공연예술통합전산망) Open API. 대중음악 공연 목록·상세를 읽는다. 서버에서만 쓴다.
// 응답은 XML 이고 항목이 평평해서 정규식으로 읽는다. 문서: kopis.or.kr Open API 개발가이드 v5.0
import 'server-only';

const BASE = 'https://kopis.or.kr/openApi/restful';
const POPULAR_MUSIC = 'CCCD'; // 장르코드: 대중음악
const MAX_DAYS = 31; // 목록 조회 한 번에 볼 수 있는 기간
const ROWS = 100;

export type KopisListItem = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  venue: string;
  area: string;
  poster?: string;
};

export type KopisDetail = KopisListItem & {
  cast: string;
  price: string;
  /** "금요일(20:00)" 같은 안내 문구 */
  schedule: string;
  runtime: string;
  /** 내한 공연 */
  isVisit: boolean;
  isFestival: boolean;
  organizer: string;
  story: string;
  vendors: { name: string; url: string }[];
};

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '');
const blocks = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1]);
const ymd = (dotted: string) => dotted.replace(/\./g, '-'); // 2026.12.18 → 2026-12-18
const compact = (date: string) => date.replace(/-/g, ''); // 2026-12-18 → 20261218
// 포스터는 http 주소로 오는데, https://kopis.or.kr 로 바꾸면 그대로 열린다 (어드민 화면 혼합 콘텐츠 방지).
const httpsPoster = (url: string) => (url ? url.replace(/^http:\/\/(www\.)?kopis\.or\.kr/, 'https://kopis.or.kr') : undefined);

async function get(path: string, params: Record<string, string> = {}) {
  const key = process.env.KOPIS_API_KEY;
  if (!key) throw new Error('KOPIS_API_KEY 환경 변수가 없어요');
  const response = await fetch(`${BASE}/${path}?${new URLSearchParams({ service: key, ...params })}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`KOPIS 요청이 실패했어요 (${response.status})`);
  const xml = await response.text();
  const error = tag(xml, 'returncode') && tag(xml, 'errmsg');
  if (error) throw new Error(`KOPIS: ${error}`);
  return xml;
}

const toListItem = (xml: string): KopisListItem => ({
  id: tag(xml, 'mt20id'),
  title: tag(xml, 'prfnm'),
  startDate: ymd(tag(xml, 'prfpdfrom')),
  endDate: ymd(tag(xml, 'prfpdto')),
  venue: tag(xml, 'fcltynm'),
  area: tag(xml, 'area'),
  poster: httpsPoster(tag(xml, 'poster')),
});

/** 'YYYY-MM-DD' 에 days 일을 더한다. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** from~to (YYYY-MM-DD) 사이에 열리는 대중음악 공연. 31일씩 나눠 모든 쪽을 읽는다. */
export async function listPopularMusic(from: string, to: string): Promise<KopisListItem[]> {
  const items = new Map<string, KopisListItem>();
  for (let start = from; start <= to; start = addDays(start, MAX_DAYS)) {
    const end = addDays(start, MAX_DAYS - 1) < to ? addDays(start, MAX_DAYS - 1) : to;
    const [stdate, eddate] = [compact(start), compact(end)];
    for (let page = 1; ; page++) {
      const xml = await get('pblprfr', { stdate, eddate, cpage: String(page), rows: String(ROWS), shcate: POPULAR_MUSIC });
      const rows = blocks(xml, 'db');
      for (const row of rows) {
        const item = toListItem(row);
        if (item.id) items.set(item.id, item);
      }
      if (rows.length < ROWS) break;
    }
  }
  return [...items.values()];
}

export async function getKopisShow(id: string): Promise<KopisDetail | undefined> {
  if (!/^PF\d+$/.test(id)) return undefined;
  const xml = await get(`pblprfr/${id}`);
  const [row] = blocks(xml, 'db');
  if (!row) return undefined;
  return {
    ...toListItem(row),
    cast: tag(row, 'prfcast'),
    price: tag(row, 'pcseguidance'),
    schedule: tag(row, 'dtguidance'),
    runtime: tag(row, 'prfruntime'),
    isVisit: tag(row, 'visit') === 'Y',
    isFestival: tag(row, 'festival') === 'Y',
    organizer: tag(row, 'entrpsnmA') || tag(row, 'entrpsnm'),
    story: tag(row, 'sty'),
    vendors: blocks(row, 'relate')
      .map((relate) => ({ name: tag(relate, 'relatenm'), url: tag(relate, 'relateurl') }))
      .filter((vendor) => vendor.name || vendor.url),
  };
}
