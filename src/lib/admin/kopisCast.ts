// KOPIS 출연진: 상세를 받아 제보에 저장하고, 등록된 아티스트와 맞춘다. 서버에서만 쓴다.
import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { castNames } from '@/lib/admin/kopisDraft';
import { getKopisShow } from '@/lib/kopis';

/** 한 번에 출연진을 받는 공연 수. 상세는 공연마다 따로 받아야 해서, 몰아서 요청하면 KOPIS 가 막는다. */
export const CAST_BATCH = 50;
const CAST_DELAY_MS = 200;

/** 공연마다 KOPIS 상세를 받아 출연진을 저장한다. 요청이 실패하면 멈추고 남은 공연은 다음에 받는다. 채운 수를 돌려준다. */
export async function fillCast(ids: number[]) {
  if (ids.length === 0) return 0;
  const rows = await db
    .select({ id: reports.id, externalId: reports.externalId })
    .from(reports)
    .where(inArray(reports.id, ids.slice(0, CAST_BATCH)));
  let filled = 0;
  for (const [index, row] of rows.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, CAST_DELAY_MS));
    const detail = await getKopisShow(row.externalId ?? '').catch(() => null);
    if (detail === null) break;
    await db
      .update(reports)
      .set({ cast: detail?.cast ?? '' })
      .where(eq(reports.id, row.id));
    filled++;
  }
  return filled;
}

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

// "데이식스(DAY6)" 는 '데이식스', 'DAY6', 전체 중 하나가 아티스트 이름과 같으면 같은 사람으로 본다.
const nameVariants = (name: string) => {
  const inner = name.match(/\(([^()]+)\)/)?.[1];
  return new Set([name, name.replace(/\s*\([^()]*\)\s*/g, ' '), inner ?? ''].map(normalize).filter(Boolean));
};

export type CastMatch = { artistIds: string[]; unknown: string[] };

/** 출연진 이름을 등록된 아티스트와 맞춘다. 공연 이름에 아티스트 이름이 들어 있어도 라인업에 넣는다 (출연진 다음 순서). */
export function matchCast(cast: string | null, title: string, artists: { id: string; name: string; aliases?: string[] }[]): CastMatch {
  // 이름과 별칭 모두로 찾는다 (KOPIS 는 한글 표기·본명으로 적기도 한다).
  const namesOf = (artist: (typeof artists)[number]) => [artist.name, ...(artist.aliases ?? [])].map(normalize);
  const byName = new Map(artists.flatMap((artist) => namesOf(artist).map((name) => [name, artist.id] as const)));
  const artistIds: string[] = [];
  const unknown: string[] = [];
  for (const name of castNames(cast)) {
    const id = [...nameVariants(name)].map((variant) => byName.get(variant)).find(Boolean);
    if (id) artistIds.push(id);
    else unknown.push(name);
  }
  const titleText = normalize(title);
  for (const artist of artists) if (namesOf(artist).some((name) => name.length >= 2 && titleText.includes(name))) artistIds.push(artist.id);
  return { artistIds: [...new Set(artistIds)], unknown };
}
