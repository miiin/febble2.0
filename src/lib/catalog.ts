// 공연·아티스트·Pick 을 DB 에서 읽는다. 화면은 mock 과 같은 모양(Show, Artist, PickIssue)으로 받는다.
// 카탈로그는 작아서 통째로 한 번 읽어 캐시하고, 개별 조회는 그 안에서 찾는다.
// CMS 에서 수정하면 revalidateTag('catalog') 로 갱신한다.
import 'server-only';
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { connection } from 'next/server';
import { db } from '@/db';
import * as t from '@/db/schema';
import type { Artist } from '@/mocks/artists';
import type { PickIssue } from '@/mocks/picks';
import type { Show } from '@/mocks/shows';

const hhmm = (time: string) => time.slice(0, 5);

export async function getCatalog() {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  return loadCatalog();
}

/** 캐시 없이 DB 에서 바로 읽는다. */
async function loadCatalog() {
  const [artistRows, showRows, lineupRows, vendorRows, stageRows, slotRows, issueRows, itemRows] = await Promise.all([
    db
      .select({
        id: t.artists.id,
        name: t.artists.name,
        image: t.artists.image,
        genres: t.artists.genres,
        bio: t.artists.bio,
        isEditorPick: t.artists.isEditorPick,
        spotifyArtistId: t.artists.spotifyArtistId,
        followerCount: count(t.artistFollows.userId),
      })
      .from(t.artists)
      .leftJoin(t.artistFollows, eq(t.artistFollows.artistId, t.artists.id))
      .groupBy(t.artists.id),
    db
      .select({
        id: t.shows.id,
        category: t.shows.category,
        title: t.shows.title,
        startDate: t.shows.startDate,
        endDate: t.shows.endDate,
        startTime: t.shows.startTime,
        timeZone: t.shows.timeZone,
        venue: t.shows.venue,
        image: t.shows.image,
        description: t.shows.description,
        price: t.shows.price,
        soldOut: t.shows.soldOut,
        createdAt: t.shows.createdAt,
        // 화면은 공연 현지 시각 'YYYY-MM-DD HH:mm' 을 쓴다.
        ticketOpenAt: sql<string | null>`to_char(${t.shows.ticketOpenAt} AT TIME ZONE ${t.shows.timeZone}, 'YYYY-MM-DD HH24:MI')`,
      })
      .from(t.shows)
      .where(eq(t.shows.isPublished, true))
      .orderBy(desc(t.shows.createdAt)),
    db.select().from(t.showArtists).orderBy(asc(t.showArtists.position)),
    db.select().from(t.ticketVendors).orderBy(asc(t.ticketVendors.position)),
    db.select().from(t.stages).orderBy(asc(t.stages.position)),
    db.select().from(t.timetableSlots).orderBy(asc(t.timetableSlots.date), asc(t.timetableSlots.startTime)),
    db.select().from(t.pickIssues).where(eq(t.pickIssues.isPublished, true)).orderBy(desc(t.pickIssues.vol)),
    db.select().from(t.pickItems).orderBy(asc(t.pickItems.position)),
  ]);

  const artists: Artist[] = artistRows.map((row) => ({
    ...row,
    image: row.image ?? undefined,
    isEditorPick: row.isEditorPick,
    spotifyArtistId: row.spotifyArtistId ?? undefined,
  }));

  // 최근 등록 순 (홈 New 가 이 순서를 쓴다).
  const shows: Show[] = showRows.map((row) => {
    const stages = stageRows.filter((stage) => stage.showId === row.id);
    const slots = slotRows.filter((slot) => slot.showId === row.id);
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      artistIds: lineupRows.filter((item) => item.showId === row.id).map((item) => item.artistId),
      startDate: row.startDate,
      endDate: row.endDate,
      startTime: row.startTime ? hhmm(row.startTime) : undefined,
      timeZone: row.timeZone,
      venue: row.venue,
      image: row.image ?? undefined,
      description: row.description ?? undefined,
      price: row.price ?? undefined,
      ticketVendors: vendorRows.filter((vendor) => vendor.showId === row.id).map(({ name, url }) => ({ name, url })),
      soldOut: row.soldOut,
      ticketOpenAt: row.ticketOpenAt ?? undefined,
      createdAt: row.createdAt.toISOString().slice(0, 10),
      timetable:
        stages.length > 0
          ? {
              stages: stages.map((stage) => ({ id: String(stage.id), name: stage.name })),
              slots: slots.map((slot) => ({
                id: String(slot.id),
                stageId: String(slot.stageId),
                artistId: slot.artistId,
                date: slot.date,
                start: hhmm(slot.startTime),
                end: hhmm(slot.endTime),
              })),
            }
          : undefined,
    };
  });

  // 비공개 공연을 고른 항목은 빼고, 메인이 빠진 호는 숨긴다.
  const publishedIds = new Set(shows.map((show) => show.id));
  const pickIssues: PickIssue[] = issueRows.flatMap((issue) => {
    const items = itemRows.filter((item) => item.issueVol === issue.vol && publishedIds.has(item.showId));
    const main = items.find((item) => item.isMain);
    if (!main) return [];
    return [
      {
        vol: issue.vol,
        publishedAt: issue.publishedAt,
        curator: issue.curator,
        main: { showId: main.showId, description: main.description },
        others: items.filter((item) => !item.isMain).map(({ showId, description }) => ({ showId, description })),
      },
    ];
  });

  return { shows, artists, pickIssues };
}

export async function getShows() {
  return (await getCatalog()).shows;
}

// 하나를 찾을 때 캐시된 카탈로그에 없으면 404 전에 DB 를 한 번 더 본다.
// 처음 보는 주소는 빌드 때 만든 틀과 그때의 카탈로그로 먼저 그려져서, 어드민에서 방금 만든 항목이 첫 방문에 404 가 될 수 있다.
async function findFresh<T>(pick: (catalog: Awaited<ReturnType<typeof loadCatalog>>) => T | undefined) {
  const cached = pick(await getCatalog());
  if (cached !== undefined) return cached;
  await connection(); // 직접 읽기는 요청 시점에만 (미리 만들 때는 여기서 멈춘다)
  return pick(await loadCatalog());
}

export async function getShow(id: string) {
  return findFresh((catalog) => catalog.shows.find((show) => show.id === id));
}

export async function getShowsByArtist(artistId: string) {
  return (await getCatalog()).shows.filter((show) => show.artistIds.includes(artistId));
}

export async function getArtists() {
  return (await getCatalog()).artists;
}

export async function getArtist(id: string) {
  return findFresh((catalog) => catalog.artists.find((artist) => artist.id === id));
}

/** 최신 호가 앞에 온다. */
export async function getPickIssues() {
  return (await getCatalog()).pickIssues;
}

export async function getIssue(vol: number) {
  return findFresh((catalog) => catalog.pickIssues.find((issue) => issue.vol === vol));
}
