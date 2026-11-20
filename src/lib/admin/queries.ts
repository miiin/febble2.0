// 어드민 화면 조회. 공개 화면과 달리 캐시하지 않고, 비공개 데이터까지 그대로 읽는다.
import 'server-only';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as t from '@/db/schema';

export async function listArtists() {
  return db
    .select({
      id: t.artists.id,
      name: t.artists.name,
      genres: t.artists.genres,
      isEditorPick: t.artists.isEditorPick,
      spotifyArtistId: t.artists.spotifyArtistId,
      followers: count(t.artistFollows.userId),
    })
    .from(t.artists)
    .leftJoin(t.artistFollows, eq(t.artistFollows.artistId, t.artists.id))
    .groupBy(t.artists.id)
    .orderBy(asc(t.artists.name));
}

export async function getArtistRow(id: string) {
  const [row] = await db.select().from(t.artists).where(eq(t.artists.id, id));
  return row;
}

export async function listGenres() {
  const rows = await db.execute<{ genre: string }>(sql`SELECT DISTINCT unnest(genres) AS genre FROM artists ORDER BY 1`);
  return rows.rows.map((row) => row.genre);
}

export async function listShows() {
  return db
    .select({
      id: t.shows.id,
      title: t.shows.title,
      category: t.shows.category,
      startDate: t.shows.startDate,
      endDate: t.shows.endDate,
      venue: t.shows.venue,
      isPublished: t.shows.isPublished,
      soldOut: t.shows.soldOut,
    })
    .from(t.shows)
    .orderBy(desc(t.shows.startDate));
}

/** 수정 화면용: 공연 + 라인업 + 예매처 + 스테이지 + 무대 */
export async function getShowForEdit(id: string) {
  const [show] = await db
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
      isPublished: t.shows.isPublished,
      // 입력칸(datetime-local)은 공연 현지 시각을 쓴다.
      ticketOpenAt: sql<string | null>`to_char(${t.shows.ticketOpenAt} AT TIME ZONE ${t.shows.timeZone}, 'YYYY-MM-DD"T"HH24:MI')`,
    })
    .from(t.shows)
    .where(eq(t.shows.id, id));
  if (!show) return undefined;

  const [lineup, vendors, stages, slots] = await Promise.all([
    db.select().from(t.showArtists).where(eq(t.showArtists.showId, id)).orderBy(asc(t.showArtists.position)),
    db.select().from(t.ticketVendors).where(eq(t.ticketVendors.showId, id)).orderBy(asc(t.ticketVendors.position)),
    db.select().from(t.stages).where(eq(t.stages.showId, id)).orderBy(asc(t.stages.position)),
    db.select().from(t.timetableSlots).where(eq(t.timetableSlots.showId, id)).orderBy(asc(t.timetableSlots.date), asc(t.timetableSlots.startTime)),
  ]);

  return {
    ...show,
    startTime: show.startTime?.slice(0, 5) ?? '',
    artistIds: lineup.map((item) => item.artistId),
    vendors: vendors.map(({ name, url }) => ({ name, url })),
    stages: stages.map(({ id, name }) => ({ id, name })),
    slots: slots.map((slot) => ({
      id: slot.id,
      stageId: slot.stageId,
      artistId: slot.artistId,
      date: slot.date,
      start: slot.startTime.slice(0, 5),
      end: slot.endTime.slice(0, 5),
    })),
  };
}

export type ShowForEdit = NonNullable<Awaited<ReturnType<typeof getShowForEdit>>>;

/** 선택 목록용 (라인업·Pick) */
export async function listArtistOptions() {
  return db.select({ id: t.artists.id, name: t.artists.name }).from(t.artists).orderBy(asc(t.artists.name));
}

export async function listShowOptions() {
  return db.select({ id: t.shows.id, title: t.shows.title, startDate: t.shows.startDate }).from(t.shows).orderBy(desc(t.shows.startDate));
}

export async function listPickIssues() {
  return db
    .select({
      vol: t.pickIssues.vol,
      publishedAt: t.pickIssues.publishedAt,
      curator: t.pickIssues.curator,
      isPublished: t.pickIssues.isPublished,
      items: count(t.pickItems.showId),
      main: sql<string | null>`max(CASE WHEN ${t.pickItems.isMain} THEN ${t.pickItems.showId} END)`,
    })
    .from(t.pickIssues)
    .leftJoin(t.pickItems, eq(t.pickItems.issueVol, t.pickIssues.vol))
    .groupBy(t.pickIssues.vol)
    .orderBy(desc(t.pickIssues.vol));
}

export async function getPickIssueForEdit(vol: number) {
  const [issue] = await db.select().from(t.pickIssues).where(eq(t.pickIssues.vol, vol));
  if (!issue) return undefined;
  const items = await db.select().from(t.pickItems).where(eq(t.pickItems.issueVol, vol)).orderBy(asc(t.pickItems.position));
  return { ...issue, items: items.map(({ showId, description, isMain }) => ({ showId, description, isMain })) };
}

export async function getReport(id: number) {
  const [row] = await db.select().from(t.reports).where(eq(t.reports.id, id));
  return row;
}

/** 사이트 제보 (모든 상태, 최신순) */
export async function listReports() {
  return db.select().from(t.reports).where(eq(t.reports.source, 'user')).orderBy(desc(t.reports.createdAt));
}

/** KOPIS 에서 가져와 아직 처리하지 않은 공연 (날짜순) */
export async function listKopisPending() {
  return db
    .select()
    .from(t.reports)
    .where(and(eq(t.reports.source, 'kopis'), eq(t.reports.status, 'pending')))
    .orderBy(asc(t.reports.date));
}

/** KOPIS 공연과 febble 의 관련을 찾는 데 쓰는 아티스트 이름·공연장 */
export async function getRelevanceHints() {
  const [artistRows, venueRows] = await Promise.all([
    db.select({ name: t.artists.name }).from(t.artists),
    db.selectDistinct({ venue: t.shows.venue }).from(t.shows),
  ]);
  return { artists: artistRows.map((row) => row.name), venues: venueRows.map((row) => row.venue) };
}

export async function getDashboardCounts() {
  const [row] = (
    await db.execute<{ shows: number; unpublished: number; artists: number; issues: number; pending: number; users: number }>(sql`SELECT
      (SELECT count(*) FROM shows)::int AS shows,
      (SELECT count(*) FROM shows WHERE NOT is_published)::int AS unpublished,
      (SELECT count(*) FROM artists)::int AS artists,
      (SELECT count(*) FROM pick_issues)::int AS issues,
      (SELECT count(*) FROM reports WHERE status = 'pending' AND source = 'user')::int AS pending,
      (SELECT count(*) FROM users)::int AS users`)
  ).rows;
  return row;
}
