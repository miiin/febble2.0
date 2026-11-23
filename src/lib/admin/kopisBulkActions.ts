'use server';

// KOPIS 목록에서 고른 공연을 한꺼번에 처리한다. AI 는 쓰지 않는다.
// 추가: KOPIS 정보를 규칙으로 옮겨 '비공개' 공연으로 만들고, 어드민이 열어 확인한 뒤 공개한다.
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { kopisBaseDraft, kopisVenue } from '@/lib/admin/kopisDraft';
import { listArtistOptions } from '@/lib/admin/queries';
import { saveShow } from '@/lib/admin/showActions';
import { getKopisShow } from '@/lib/kopis';
import { putObject } from '@/lib/storage';

/** 한 번에 추가할 수 있는 공연 수 (KOPIS 요청이 몰리면 막힌다) */
const MAX_ADD = 20;

export type BulkAddResult = { added: number; failed: { title: string; error: string }[]; error?: string };

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

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

export async function addKopisShows(ids: number[]): Promise<BulkAddResult> {
  await assertAdmin();
  if (ids.length > MAX_ADD) return { added: 0, failed: [], error: `한 번에 ${MAX_ADD}개까지 추가할 수 있어요` };
  const [rows, artists] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(and(inArray(reports.id, ids), eq(reports.source, 'kopis'), eq(reports.status, 'pending'))),
    listArtistOptions(),
  ]);

  const failed: BulkAddResult['failed'] = [];
  let added = 0;
  // KOPIS 요청이 몰리지 않게 하나씩 처리한다.
  for (const report of rows) {
    const error = await addOne(report, artists);
    if (error) failed.push({ title: report.title, error });
    else added++;
  }
  revalidatePath('/admin/reports');
  return { added, failed };
}

/** 실패하면 이유를 돌려준다. */
async function addOne(report: typeof reports.$inferSelect, artists: { id: string; name: string }[]) {
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

  // 등록된 아티스트 이름이 공연 이름이나 출연진에 그대로 있으면 라인업에 넣는다 (나온 순서대로).
  const text = normalize(`${report.title} ${kopis?.cast ?? ''}`);
  const artistIds = artists
    .map((artist) => ({ id: artist.id, at: normalize(artist.name).length >= 2 ? text.indexOf(normalize(artist.name)) : -1 }))
    .filter((match) => match.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((match) => match.id);

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
    isPublished: false,
    artistIds,
    vendors: draft.ticketVendors.flatMap((vendor) => (vendor.url && /^https?:\/\//.test(vendor.url) ? [{ name: vendor.name, url: vendor.url }] : [])),
    stages: [],
    slots: [],
    kopisId: externalId,
    details: {}, // 공연 안내는 필요한 공연에만 어드민이 직접 넣는다
  });
  if (result.error) return result.error;
  await db.update(reports).set({ status: 'added' }).where(eq(reports.id, report.id));
}

/** KOPIS 포스터를 webp 로 바꿔 R2 에 올린다. 실패하면 포스터 없이 만든다. */
async function copyPoster(url: string | null | undefined) {
  if (!url?.startsWith('https://kopis.or.kr/')) return undefined;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return undefined;
    const webp = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return await putObject(`shows/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`, webp, 'image/webp');
  } catch {
    return undefined;
  }
}
