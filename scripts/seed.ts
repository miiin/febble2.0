// src/mocks 의 공연·아티스트·Pick 을 DB 에 넣는다. 실행: npm run db:seed
// 카탈로그 테이블을 비우고 다시 넣는다 (유저와 제보는 건드리지 않지만, 팔로우·찜·담은 무대는 같이 비워진다).
import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import { artists } from '../src/mocks/artists';
import { pickIssues } from '../src/mocks/picks';
import { DEFAULT_TIME_ZONE, shows } from '../src/mocks/shows';

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  // RESTART IDENTITY: 스테이지·슬롯 id 가 1 부터 다시 붙는다.
  await db.execute(sql`TRUNCATE artists, shows, pick_issues RESTART IDENTITY CASCADE`);

  await db.insert(schema.artists).values(
    artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.image,
      genres: artist.genres,
      bio: artist.bio,
      isEditorPick: artist.isEditorPick ?? false,
      spotifyArtistId: artist.spotifyArtistId,
    })),
  );

  // mock 배열 순서대로 최근 등록된 것처럼 created_at 을 1분씩 당긴다 (홈 New 정렬용).
  const now = Date.now();
  await db.insert(schema.shows).values(
    shows.map((show, index) => {
      const timeZone = show.timeZone ?? DEFAULT_TIME_ZONE;
      return {
        id: show.id,
        category: show.category,
        title: show.title,
        startDate: show.startDate,
        endDate: show.endDate,
        startTime: show.startTime,
        timeZone,
        venue: show.venue,
        image: show.image,
        description: show.description,
        price: show.price,
        soldOut: show.soldOut ?? false,
        // 'YYYY-MM-DD HH:mm' 은 공연 현지 시각이다.
        ticketOpenAt: show.ticketOpenAt ? sql`(${show.ticketOpenAt}::timestamp AT TIME ZONE ${timeZone})` : null,
        isPublished: true,
        createdAt: new Date(now - index * 60_000),
      };
    }),
  );

  await db
    .insert(schema.showArtists)
    .values(shows.flatMap((show) => show.artistIds.map((artistId, position) => ({ showId: show.id, artistId, position }))));

  await db
    .insert(schema.ticketVendors)
    .values(shows.flatMap((show) => show.ticketVendors.map((vendor, position) => ({ showId: show.id, ...vendor, position }))));

  for (const show of shows) {
    if (!show.timetable) continue;
    const stageRows = await db
      .insert(schema.stages)
      .values(show.timetable.stages.map((stage, position) => ({ showId: show.id, name: stage.name, position })))
      .returning({ id: schema.stages.id });
    const stageId = new Map(show.timetable.stages.map((stage, index) => [stage.id, stageRows[index].id]));

    await db.insert(schema.timetableSlots).values(
      show.timetable.slots.map((slot) => ({
        showId: show.id,
        stageId: stageId.get(slot.stageId)!,
        artistId: slot.artistId,
        date: slot.date,
        startTime: slot.start,
        endTime: slot.end,
      })),
    );
  }

  await db.insert(schema.pickIssues).values(
    pickIssues.map((issue) => ({ vol: issue.vol, publishedAt: issue.publishedAt, curator: issue.curator, isPublished: true })),
  );
  await db.insert(schema.pickItems).values(
    pickIssues.flatMap((issue) => [
      { issueVol: issue.vol, ...issue.main, isMain: true, position: 0 },
      ...issue.others.map((item, index) => ({ issueVol: issue.vol, ...item, position: index + 1 })),
    ]),
  );

  const [counts] = (
    await db.execute(sql`SELECT
      (SELECT count(*) FROM artists) AS artists,
      (SELECT count(*) FROM shows) AS shows,
      (SELECT count(*) FROM timetable_slots) AS slots,
      (SELECT count(*) FROM pick_issues) AS issues,
      (SELECT count(*) FROM pick_items) AS pick_items`)
  ).rows;
  console.log('seeded:', counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
