'use server';

// KOPIS 목록에서 고른 공연을 한꺼번에 처리한다. AI 는 쓰지 않는다.
// 추가: 확인 창(previewKopisAdd)에서 출연진 중 새로 만들 아티스트와 공개 여부를 고른 뒤,
// 아티스트를 만들고 KOPIS 정보를 규칙으로 옮겨 공연을 만든다 (라인업까지 연결).
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath, updateTag } from 'next/cache';
import { db } from '@/db';
import { artists as artistsTable, reports } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { fillCast, matchCast } from '@/lib/admin/kopisCast';
import { kopisBaseDraft, kopisVenue } from '@/lib/admin/kopisDraft';
import { listArtistOptions } from '@/lib/admin/queries';
import { copyRemoteImage } from '@/lib/admin/remoteImage';
import { saveShow } from '@/lib/admin/showActions';
import { getKopisShow } from '@/lib/kopis';
import { artistSlug, uniqueSlug } from '@/lib/slug';
import { searchArtists } from '@/lib/spotify';

/** 한 번에 추가할 수 있는 공연 수 (KOPIS 요청이 몰리면 막힌다) */
const MAX_ADD = 20;

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

const selectPending = (ids: number[]) =>
  db
    .select()
    .from(reports)
    .where(and(inArray(reports.id, ids), eq(reports.source, 'kopis'), eq(reports.status, 'pending')));

export async function rejectKopisReports(ids: number[]): Promise<{ count: number }> {
  await assertAdmin();
  if (ids.length === 0) return { count: 0 };
  const rows = await db
    .update(reports)
    .set({ status: 'rejected' })
    .where(and(inArray(reports.id, ids), eq(reports.source, 'kopis'), eq(reports.status, 'pending')))
    .returning({ id: reports.id });
  revalidatePath('/admin/reports');
  return { count: rows.length };
}

export type KopisAddPreview = {
  reportId: number;
  title: string;
  /** 라인업에 연결될 등록된 아티스트 */
  matched: { id: string; name: string }[];
  /** 출연진 중 등록되지 않은 이름 */
  unknown: string[];
  /** KOPIS 에 출연진이 없음 */
  noCast: boolean;
};

/** 확인 창 내용. 출연진을 아직 받지 않은 공연은 여기서 받는다. */
export async function previewKopisAdd(ids: number[]): Promise<{ items?: KopisAddPreview[]; error?: string }> {
  await assertAdmin();
  if (ids.length > MAX_ADD) return { error: `한 번에 ${MAX_ADD}개까지 추가할 수 있어요` };
  const missing = (await selectPending(ids)).filter((row) => row.cast === null).map((row) => row.id);
  await fillCast(missing);
  const [rows, artists] = await Promise.all([selectPending(ids), listArtistOptions()]);
  const nameOf = new Map(artists.map((artist) => [artist.id, artist.name]));
  return {
    items: rows.map((row) => {
      const match = matchCast(row.cast, row.title, artists);
      return {
        reportId: row.id,
        title: row.title,
        matched: match.artistIds.map((id) => ({ id, name: nameOf.get(id) ?? id })),
        unknown: match.unknown,
        noCast: !row.cast,
      };
    }),
  };
}

export type BulkAddResult = { added: number; createdArtists: number; failed: { title: string; error: string }[]; error?: string };

/** newArtists: 출연진 중 새로 만들 아티스트 이름. publish: 바로 공개 */
export async function addKopisShows(ids: number[], options: { newArtists: string[]; publish: boolean }): Promise<BulkAddResult> {
  await assertAdmin();
  if (ids.length > MAX_ADD) return { added: 0, createdArtists: 0, failed: [], error: `한 번에 ${MAX_ADD}개까지 추가할 수 있어요` };

  const createdArtists = await createArtists(options.newArtists);
  const [rows, artists] = await Promise.all([selectPending(ids), listArtistOptions()]);

  const failed: BulkAddResult['failed'] = [];
  let added = 0;
  // KOPIS 요청이 몰리지 않게 하나씩 처리한다.
  for (const report of rows) {
    const error = await addOne(report, artists, options.publish);
    if (error) failed.push({ title: report.title, error });
    else added++;
  }
  if (createdArtists) updateTag('catalog');
  revalidatePath('/admin/reports');
  return { added, createdArtists, failed };
}

/** 이름만으로 아티스트를 만든다. id 는 이름으로 자동, Spotify 에 이름이 똑같은 아티스트가 있으면 연결하고 장르도 가져온다. 만든 수를 돌려준다. */
async function createArtists(names: string[]) {
  const existing = await listArtistOptions();
  const knownNames = new Set(existing.flatMap((artist) => [artist.name, ...artist.aliases].map(normalize)));
  const takenIds = new Set(existing.map((artist) => artist.id));
  let created = 0;
  for (const raw of names) {
    const name = raw.trim().slice(0, 100);
    if (!name || knownNames.has(normalize(name))) continue;
    knownNames.add(normalize(name));

    const spotify = (await searchArtists(name, 5).catch(() => [])).find((artist) => normalize(artist.name) === normalize(name));
    const id = uniqueSlug(artistSlug(name) || 'artist', takenIds);
    takenIds.add(id);
    await db
      .insert(artistsTable)
      .values({ id, name, genres: spotify?.genres ?? [], spotifyArtistId: spotify?.id ?? null, spotifyImageUrl: spotify?.imageLarge ?? null });
    created++;
  }
  return created;
}

/** 실패하면 이유를 돌려준다. */
async function addOne(report: typeof reports.$inferSelect, artists: { id: string; name: string }[], publish: boolean) {
  const externalId = report.externalId ?? '';
  const kopis = await getKopisShow(externalId).catch(() => undefined);

  // 상세를 받지 못하면 가져올 때 저장한 목록 정보(이름·날짜·공연장)로 만든다.
  let draft;
  if (kopis) {
    draft = kopisBaseDraft(kopis);
  } else {
    const [startDate, endDate = startDate] = (report.date ?? '').split(' ~ ');
    const venue = report.venue?.match(/^(.*) \(([^()]*)\)$/); // "롤링홀 (서울특별시)"
    draft = {
      title: report.title,
      category: 'indie' as const,
      startDate,
      endDate,
      startTime: null,
      venue: venue ? kopisVenue(venue[1], venue[2]) : report.venue,
      timeZone: 'Asia/Seoul',
      price: null,
      ticketVendors: [],
    };
  }

  const result = await saveShow(null, {
    id: `kopis-${externalId.toLowerCase()}`,
    category: draft.category ?? 'indie',
    title: draft.title ?? report.title,
    startDate: draft.startDate ?? '',
    endDate: draft.endDate ?? draft.startDate ?? '',
    startTime: draft.startTime ?? '',
    timeZone: 'Asia/Seoul',
    venue: draft.venue ?? '',
    image: (await copyPoster(kopis?.poster ?? report.poster)) ?? '',
    description: '',
    price: draft.price ?? '',
    ticketOpenAt: '',
    soldOut: false,
    isPublished: publish,
    // 출연진 순서대로, 그다음 공연 이름에 나온 아티스트
    artistIds: matchCast(kopis?.cast ?? report.cast, report.title, artists).artistIds,
    vendors: draft.ticketVendors.flatMap((vendor) => (vendor.url && /^https?:\/\//.test(vendor.url) ? [{ name: vendor.name, url: vendor.url }] : [])),
    stages: [],
    slots: [],
    kopisId: externalId,
    details: {}, // 공연 안내는 필요한 공연에만 어드민이 직접 넣는다
  });
  if (result.error) return result.error;
  await db.update(reports).set({ status: 'added' }).where(eq(reports.id, report.id));
}

/** KOPIS 포스터를 R2 로 복사한다. 실패하면 포스터 없이 만든다. */
const copyPoster = async (url: string | null | undefined) => (url ? copyRemoteImage(url) : undefined);
